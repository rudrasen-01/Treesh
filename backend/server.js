import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import streamRoutes from "./routes/streams.js";
import matchRoutes from "./routes/matches.js";
import chatRoutes from "./routes/chat.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import settingsRoutes from "./routes/settings.js";
import arcadeRoutes from "./routes/arcade.js";
import reportRoutes from "./routes/reports.js";
import contentReportRoutes from "./routes/contentReports.js";
import reelsRoutes from "./routes/reels.js";
import psaRoutes from "./routes/psa.js";
import analyticsRoutes from "./routes/analytics.js";
import staticRoutes from "./routes/static.js";
import matchmakingRoutes from "./routes/matchmaking.js";
import uploadRoutes from "./routes/upload.js";
import storiesRoutes from "./routes/stories.js";
import paymentRoutes from "./routes/payment.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { socketAuth } from "./middleware/socketAuth.js";
import User from "./models/User.js";

dotenv.config();







import dns from "dns";

// DNS setup
const primaryDNS = ["1.1.1.1", "1.0.0.1"];
const fallbackDNS = ["8.8.4.4", "8.8.8.8"];

dns.setServers(primaryDNS);

console.log("🔧 DNS configured:");
console.log("   └─ Primary: Cloudflare");
console.log("   └─ Fallback: Google");







const app = express();
const server = createServer(app);

// Trust proxy - Required when behind Nginx
app.set("trust proxy", 1);

const io = new Server(server, {
  cors: {
    origin: [
      "https://treessocialmedia-ci5o.vercel.app",
      "https://treessocialmedia.vercel.app",
      "https://trees-admin-lh9z.vercel.app",
      "https://trees-admin.vercel.app",
      "https://inventurcubes.com",
      "https://www.inventurcubes.com",
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:5173",
      "https://e1c4e1bea8e0.ngrok-free.app",
      /^https:\/\/[a-z0-9-]+\.ngrok\.io$/,
      /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/,
      /^https:\/\/[a-z0-9-]+\.ngrok\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Rate limiting - Very generous limits for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000, // Increased to 5000 for development
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  // Trust proxy to get real IP address
  trustProxy: true,
  // Skip failed requests (don't count them)
  skipFailedRequests: true,
  // Skip successful requests (only count bad requests)
  skipSuccessfulRequests: false,
});

// Middleware (CORS MUST COME FIRST)
const corsOptions = {
  origin: [
    // "https://transfer-trees-1.onrender.com",
    // "https://transfer-trees-1.onrender.com/api",
    "https://treesh-admin.vercel.app",
    "https://inventurcubes.com",
    "https://www.inventurcubes.com",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
    "https://e1c4e1bea8e0.ngrok-free.app",
    process.env.VITE_ADMIN_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
// Explicit preflight support
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(morgan("combined"));
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add request timeout for debugging
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 seconds
  res.setTimeout(60000);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/arcade", arcadeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/content-reports", contentReportRoutes);
app.use("/api/reels", reelsRoutes);
app.use("/api/psa", psaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/static", staticRoutes);
app.use("/api/admin/matchmaking", matchmakingRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.path,
    method: req.method,
  });
});

// Socket.IO connection handling
io.use(socketAuth);
io.on("connection", (socket) => {
  console.log("User connected:", socket.userId);

  socket.join(`user_${socket.userId}`);

  // Mark user online
  if (socket.userId) {
    User.findByIdAndUpdate(socket.userId, { $set: { isOnline: true } }).catch(
      () => {},
    );
  }

  socket.on("join_chat", (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  socket.on("send_message", (data) => {
    socket.to(`chat_${data.chatId}`).emit("new_message", data);
  });

  // Stream-related Socket.IO events
  socket.on("join_stream", async (streamId) => {
    try {
      socket.join(`stream_${streamId}`);
      const Stream = (await import("./models/Stream.js")).default;
      const stream = await Stream.findById(streamId);
      if (stream && stream.status === "live") {
        // Emit updated viewer count to all viewers
        io.to(`stream_${streamId}`).emit("stream_viewer_count", {
          streamId,
          viewerCount: stream.currentViewers || 0,
        });
      }
    } catch (error) {
      console.error("Error joining stream room:", error);
    }
  });

  socket.on("leave_stream", (streamId) => {
    socket.leave(`stream_${streamId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId);
    if (socket.userId) {
      User.findByIdAndUpdate(socket.userId, {
        $set: { isOnline: false, lastSeen: new Date() },
      }).catch(() => {});
    }
  });
});

// Error handling middleware
app.use(errorHandler);

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const mongoURI =
        process.env.MONGODB_URI ||
        "mongodb://localhost:27017/social-media-platform";

      const options = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 2,
      };

      const conn = await mongoose.connect(mongoURI, options);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries++;

      console.error(
        `❌ MongoDB Error (Attempt ${retries}/${maxRetries}): ${error.message}`
      );

      // Switch DNS after 2nd retry
      if (retries === 2) {
        console.log("🔄 Switching to Google DNS...");
        dns.setServers(fallbackDNS);
      }

      if (retries < maxRetries) {
        const waitTime = Math.min(1000 * 2 ** (retries - 1), 15000);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
  }

  console.error("❌ Failed to connect to MongoDB");
  process.exit(1);
};

const startServer = async () => {
  await connectDB();
  const requestedPort = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== "production";

  const tryListen = (port, retriesLeft = 5) => {
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        if (isDev && !process.env.PORT && retriesLeft > 0) {
          const nextPort = port + 1;
          console.warn(
            `⚠️ Port ${port} is already in use. Retrying on ${nextPort}...`
          );
          return tryListen(nextPort, retriesLeft - 1);
        }

        console.error(
          `❌ Port ${port} is already in use. Stop the existing process or set a different PORT in .env.`
        );
        process.exit(1);
      }

      console.error("❌ Failed to start server:", error.message);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      if (port !== requestedPort) {
        console.log(
          `ℹ️ Requested port ${requestedPort} was busy, switched to ${port}`
        );
      }
    });
  };

  tryListen(requestedPort);
};

startServer();







export { io };
