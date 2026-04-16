import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import razorPay from "../config/razorPay.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import PlanSubscription from "../models/PlanSubscription.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const PAYMENT_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";

// Debug: Log currency at startup
console.log("💰 PAYMENT_CURRENCY CONFIGURED:", PAYMENT_CURRENCY);
console.log("📝 env.RAZORPAY_CURRENCY:", process.env.RAZORPAY_CURRENCY);

/* ================= CREATE ORDER ================= */

router.post("/create-order", authenticateToken, async (req, res) => {
  try {
    const { planId, quantity = 1 } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Razorpay keys are not configured on server",
      });
    }

    if (!planId) {
      return res.status(400).json({ success: false, error: "planId is required" });
    }

    const subscriberIdRaw = req.user?._id || req.user?.id;
    if (!subscriberIdRaw || !mongoose.Types.ObjectId.isValid(subscriberIdRaw)) {
      return res.status(400).json({
        success: false,
        error: "Please login with a valid account to purchase subscriptions",
      });
    }

    let plan = null;
    if (mongoose.Types.ObjectId.isValid(planId)) {
      plan = await SubscriptionPlan.findOne({ _id: planId, isActive: true });
    }
    if (!plan) {
      plan = await SubscriptionPlan.findOne({ code: String(planId).toLowerCase(), isActive: true });
    }

    if (!plan) {
      return res.status(404).json({ success: false, error: "Subscription plan not found" });
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const totalAmount = Number(plan.price) * safeQuantity;

    // Debug: Log what we're sending to Razorpay
    console.log("🔵 RAZORPAY ORDER REQUEST:", {
      planId,
      planName: plan.name,
      planPrice: plan.price,
      quantity: safeQuantity,
      totalAmount,
      amountInCents: Math.round(totalAmount * 100),
      currency: PAYMENT_CURRENCY,
    });

    const order = await razorPay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: PAYMENT_CURRENCY,
      receipt: "receipt_" + Date.now(),
      notes: {
        planId: plan._id.toString(),
        subscriberId: String(subscriberIdRaw),
      },
    });

    console.log("✅ RAZORPAY ORDER CREATED:", {
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
    });

    const subscriberId = new mongoose.Types.ObjectId(String(subscriberIdRaw));

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    await PlanSubscription.create({
      subscriberId,
      planId: plan._id,
      planCode: plan.code,
      planName: plan.name,
      price: Number(plan.price),
      currency: PAYMENT_CURRENCY,
      quantity: safeQuantity,
      amount: totalAmount,
      orderId: order.id,
      status: "pending",
      paymentStatus: "pending",
      startsAt: startDate,
      endsAt: endDate,
    });

    res.json({
      success: true,
      order,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      plan: {
        id: plan._id,
        code: plan.code,
        name: plan.name,
        price: Number(plan.price),
        currency: PAYMENT_CURRENCY,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ================= VERIFY PAYMENT ================= */

router.post("/verify-payment", authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment payload" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      await PlanSubscription.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed", paymentStatus: "failed" },
      );
      return res.status(400).json({ success: false, error: "Signature verification failed" });
    }

    const subscriberId = req.user?._id || req.user?.id;
    if (!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId)) {
      return res.status(400).json({ success: false, error: "Invalid subscriber account" });
    }

    console.log("🔍 VERIFY PAYMENT - Looking for subscription:", {
      orderId: razorpay_order_id,
      subscriberId,
    });

    let pending = await PlanSubscription.findOne({
      orderId: razorpay_order_id,
      subscriberId,
    });

    console.log("📦 SUBSCRIPTION FOUND:", !!pending, pending ? {
      id: pending._id,
      status: pending.status,
      paymentStatus: pending.paymentStatus,
    } : null);

    if (!pending) {
      if (!planId) {
        return res
          .status(400)
          .json({ success: false, error: "Plan context not found for this order" });
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ success: false, error: "Plan not found" });
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      pending = await PlanSubscription.create({
        subscriberId,
        planId: plan._id,
        planCode: plan.code,
        planName: plan.name,
        price: Number(plan.price),
        currency: PAYMENT_CURRENCY,
        quantity: 1,
        amount: Number(plan.price),
        orderId: razorpay_order_id,
        status: "pending",
        paymentStatus: "pending",
        startsAt: startDate,
        endsAt: endDate,
      });
    }

    // Use existing dates if available, else create new ones
    const startDate = pending.startsAt || new Date();
    let endDate = pending.endsAt;
    
    if (!endDate) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 30);
      endDate = end;
    }

    pending.paymentId = razorpay_payment_id;
    pending.signature = razorpay_signature;
    pending.status = "active";
    pending.paymentStatus = "completed";
    pending.startsAt = startDate;
    pending.endsAt = endDate;
    await pending.save();

    console.log("✅ PAYMENT VERIFIED - Subscription Activated:", {
      subscriptionId: pending._id,
      orderId: pending.orderId,
      status: pending.status,
      paymentStatus: pending.paymentStatus,
      startsAt: pending.startsAt,
      endsAt: pending.endsAt,
    });

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: pending,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

router.get("/my-plan-subscriptions", authenticateToken, async (req, res) => {
  try {
    const subscriberId = req.user?._id || req.user?.id;
    let subscriptions = await PlanSubscription.find({ subscriberId })
      .sort({ createdAt: -1 })
      .populate("planId", "name code description features");

    console.log("📊 RAW SUBSCRIPTIONS FROM DB:", subscriptions.map(s => ({
      id: s._id,
      status: s.status,
      paymentStatus: s.paymentStatus,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      createdAt: s.createdAt,
    })));

    // Ensure all subscriptions have start and end dates - CRITICAL FIX
    subscriptions = await Promise.all(subscriptions.map(async (sub) => {
      let needsUpdate = false;
      const subObj = sub.toObject ? sub.toObject() : { ...sub };
      
      // If no startDate, use createdAt
      if (!subObj.startsAt || subObj.startsAt === null) {
        subObj.startsAt = subObj.createdAt || new Date();
        needsUpdate = true;
      }
      
      // If no endDate, calculate from startDate
      if (!subObj.endsAt || subObj.endsAt === null) {
        const startDate = new Date(subObj.startsAt);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        subObj.endsAt = endDate;
        needsUpdate = true;
      }
      
      // Update in database if dates were missing
      if (needsUpdate) {
        try {
          await PlanSubscription.findByIdAndUpdate(
            sub._id,
            {
              startsAt: subObj.startsAt,
              endsAt: subObj.endsAt,
            },
            { new: true }
          );
          console.log(`✅ Updated missing dates for subscription ${sub._id}`);
        } catch (updateErr) {
          console.error(`❌ Failed to update dates for ${sub._id}:`, updateErr.message);
        }
      }
      
      return subObj;
    }));

    const now = new Date();
    
    // Filter by actual status
    const active = subscriptions.filter(
      (sub) => sub.status === "active" && sub.endsAt && new Date(sub.endsAt) > now,
    );
    
    // History shows ALL transactions (active + expired + cancelled + failed + pending)
    // Sorted by creation date (newest first)
    const history = subscriptions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("🔍 FILTERED RESULTS:", {
      totalSubscriptions: subscriptions.length,
      activeCount: active.length,
      historyCount: history.length,
      historyIncludes: "ALL transactions (active + expired + cancelled + failed + pending)",
    });

    res.json({
      success: true,
      data: {
        subscriptions,
        active,
        history,
      },
    });
  } catch (error) {
    console.error("❌ ERROR in my-plan-subscriptions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
