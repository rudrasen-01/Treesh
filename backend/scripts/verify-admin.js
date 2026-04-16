import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectWithRetry } from "./db-connection.js";
import User from "../models/User.js";

dotenv.config();

async function verifyAdminUser() {
  try {
    console.log("Connecting to MongoDB...");
    await connectWithRetry();
    console.log("✓ Connected to MongoDB\n");

    // Find admin user
    const admin = await User.findOne({ 
      $or: [
        { email: "admin@example.com" },
        { username: "admin" }
      ]
    }).select("+password");

    if (!admin) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log("Admin User Details:");
    console.log("====================");
    console.log(`✓ Username: ${admin.username}`);
    console.log(`✓ Email: ${admin.email}`);
    console.log(`✓ Name: ${admin.name}`);
    console.log(`✓ Role: ${admin.role}`);
    console.log(`✓ Status: ${admin.status}`);
    console.log(`✓ Verified: ${admin.isVerified}`);
    console.log(`✓ ID: ${admin._id}`);
    
    // Test password
    const isMatch = await admin.matchPassword("Admin@1234");
    console.log(`✓ Password verification: ${isMatch ? "✅ PASSED" : "❌ FAILED"}`);
    
    // Check demo users
    console.log("\n\nDemo Users:");
    console.log("====================");
    const demoUsers = await User.find({
      email: { 
        $in: ["alice@example.com", "bob@example.com", "carol@example.com"]
      }
    }).select("username email role");

    demoUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
    });

    console.log("\n✓ Admin user verification complete!");
    console.log("\nYou can now login with:");
    console.log("  Email: admin@example.com");
    console.log("  Username: admin");
    console.log("  Password: Admin@1234");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdminUser();
