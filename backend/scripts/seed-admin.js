import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { connectWithRetry } from "./db-connection.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Reel from "../models/Reel.js";
import Stream from "../models/Stream.js";
import Match from "../models/Match.js";
import Report from "../models/Reports.js";
import ContentReport from "../models/ContentReport.js";
import Notification from "../models/Notification.js";

dotenv.config();

// Admin credentials
const ADMIN_USER = {
  username: "admin",
  email: "admin@example.com",
  password: "Admin@1234",
  name: "Admin User",
  avatar: "https://i.pravatar.cc/300?img=50",
  bio: "Platform Administrator",
  location: "Global",
  role: "admin",
  status: "active",
  isVerified: true,
};

// Demo users for testing
const DEMO_USERS = [
  {
    username: "alice_demo",
    email: "alice@example.com",
    password: "Demo@1234",
    name: "Alice Johnson",
    avatar: "https://i.pravatar.cc/300?img=1",
    bio: "Content creator and streamer",
    location: "New York",
    role: "streamer",
    status: "active",
    isStreamer: true,
  },
  {
    username: "bob_demo",
    email: "bob@example.com",
    password: "Demo@1234",
    name: "Bob Smith",
    avatar: "https://i.pravatar.cc/300?img=2",
    bio: "Gaming enthusiast",
    location: "San Francisco",
    role: "user",
    status: "active",
    isStreamer: false,
  },
  {
    username: "carol_demo",
    email: "carol@example.com",
    password: "Demo@1234",
    name: "Carol Davis",
    avatar: "https://i.pravatar.cc/300?img=3",
    bio: "Music lover and creator",
    location: "London",
    role: "streamer",
    status: "active",
    isStreamer: true,
  },
];

async function ensureAdminUser() {
  console.log("Creating admin user...");
  
  // Check if admin already exists
  let admin = await User.findOne({ email: ADMIN_USER.email.toLowerCase() });
  
  if (admin) {
    console.log("✓ Admin user already exists:", admin.username);
    return admin;
  }

  admin = new User({
    username: ADMIN_USER.username,
    email: ADMIN_USER.email.toLowerCase(),
    password: ADMIN_USER.password,
    name: ADMIN_USER.name,
    avatar: ADMIN_USER.avatar,
    bio: ADMIN_USER.bio,
    location: ADMIN_USER.location,
    role: ADMIN_USER.role,
    status: ADMIN_USER.status,
    isVerified: ADMIN_USER.isVerified,
  });

  await admin.save();
  console.log("✓ Admin user created successfully");
  return admin;
}

async function ensureDemoUsers() {
  console.log("\nCreating demo users...");
  const createdUsers = [];

  for (const userData of DEMO_USERS) {
    let user = await User.findOne({ email: userData.email.toLowerCase() });

    if (user) {
      console.log(`✓ User already exists: ${user.username}`);
      createdUsers.push(user);
      continue;
    }

    user = new User({
      username: userData.username,
      email: userData.email.toLowerCase(),
      password: userData.password,
      name: userData.name,
      avatar: userData.avatar,
      bio: userData.bio,
      location: userData.location,
      role: userData.role,
      status: userData.status,
      isStreamer: userData.isStreamer,
      isVerified: true,
    });

    await user.save();
    console.log(`✓ User created: ${user.username}`);
    createdUsers.push(user);
  }

  return createdUsers;
}

async function createSampleData(demoUsers) {
  console.log("\nCreating sample data for dashboard...");

  try {
    // Create sample posts
    for (const user of demoUsers) {
      for (let i = 0; i < 2; i++) {
        const post = await Post.create({
          authorId: user._id,
          content: `Sample post ${i + 1} from ${user.name}. This is demo content for testing the admin panel. #demo #testing`,
          media: [],
          type: "text",
          visibility: "public",
          tags: ["demo", "testing"],
          likes: [],
          comments: [],
          shares: 0,
        });
        console.log(`  ✓ Created post: ${post._id}`);
      }
    }

    // Create sample reels
    for (const user of demoUsers.slice(0, 2)) {
      for (let i = 0; i < 1; i++) {
        const reel = await Reel.create({
          author: user._id,
          caption: `Sample Reel ${i + 1} from ${user.name}`,
          videoUrl: "https://example.com/video.mp4",
          thumbnail: user.avatar,
          tags: ["demo"],
          category: "general",
          duration: 30,
          likes: [],
          comments: [],
        });
        console.log(`  ✓ Created reel: ${reel._id}`);
      }
    }

    // Create sample notifications
    for (const user of demoUsers) {
      const notification = await Notification.create({
        recipient: user._id,
        type: "like",
        message: `Your post was liked`,
        isRead: false,
      });
      console.log(`  ✓ Created notification: ${notification._id}`);
    }

    // Create sample content reports
    for (let i = 0; i < 2; i++) {
      const report = await ContentReport.create({
        reportedBy: demoUsers[0]._id,
        contentType: "post",
        contentId: null,
        reason: `Sample report reason ${i + 1}`,
        description: "This is a demo report for testing the admin panel",
        status: i === 0 ? "open" : "resolved",
      });
      console.log(`  ✓ Created report: ${report._id}`);
    }
  } catch (error) {
    console.log(`  ! Could not create all sample data: ${error.message}`);
    console.log(`  ! This is okay - core data (users) has been created`);
  }
}

async function generateSeedOutput(admin, demoUsers) {
  const output = [
    "=".repeat(60),
    "ADMIN PANEL SEED DATA",
    "=".repeat(60),
    "",
    "ADMIN ACCOUNT:",
    `  Username: ${admin.username}`,
    `  Email: ${admin.email}`,
    `  Password: ${ADMIN_USER.password}`,
    `  ID: ${admin._id}`,
    "",
    "DEMO USER ACCOUNTS:",
    ...demoUsers.map(
      (user, i) =>
        `  ${i + 1}. ${user.name}\n     Username: ${user.username}\n     Email: ${user.email}\n     Password: ${DEMO_USERS[i].password}\n     ID: ${user._id}`
    ),
    "",
    "ADMIN PANEL ACCESS:",
    "  URL: http://localhost:5173 (or your admin panel URL)",
    "  Login with admin credentials above",
    "",
    "API ENDPOINTS:",
    "  Dashboard Stats: GET /api/admin/dashboard/stats",
    "  Users List: GET /api/admin/users",
    "  Posts List: GET /api/admin/posts",
    "  Reports: GET /api/admin/reports",
    "  Activities: GET /api/admin/activities/recent",
    "",
    "=".repeat(60),
  ].join("\n");

  const outDir = path.resolve(process.cwd(), "seed-output");
  const outFile = path.join(outDir, "admin-seed-data.txt");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, output, { encoding: "utf8" });

  console.log(`\n✓ Seed data written to: ${outFile}`);
  console.log("\n" + output);
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await connectWithRetry();
    console.log("✓ Connected to MongoDB\n");

    // Create admin user
    const admin = await ensureAdminUser();

    // Create demo users
    const demoUsers = await ensureDemoUsers();

    // Create sample data
    await createSampleData(demoUsers);

    // Generate output file with credentials
    await generateSeedOutput(admin, demoUsers);

    console.log("\n✓ Seeding completed successfully!");
    console.log("You can now login to the admin panel with the credentials above.");
  } catch (e) {
    console.error("✗ Seeding failed:", e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
