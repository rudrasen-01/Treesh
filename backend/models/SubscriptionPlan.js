import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, "Plan name cannot exceed 80 characters"],
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: [40, "Plan code cannot exceed 40 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [400, "Description cannot exceed 400 characters"],
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "USD",
    },
    features: [
      {
        type: String,
        trim: true,
        maxlength: [140, "Feature text cannot exceed 140 characters"],
      },
    ],
    icon: {
      type: String,
      trim: true,
      default: "star",
    },
    color: {
      type: String,
      trim: true,
      default: "bg-slate-500",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1, price: 1 });

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
