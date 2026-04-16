import mongoose from "mongoose";
import dns from "dns";

const primaryDNS = ["1.1.1.1", "1.0.0.1"];
const fallbackDNS = ["8.8.4.4", "8.8.8.8"];

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/social-media-platform";

export const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;

  dns.setServers(primaryDNS);
  console.log("Using Cloudflare DNS for MongoDB lookup");

  while (retries < maxRetries) {
    try {
      const options = {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 2,
      };

      const conn = await mongoose.connect(MONGODB_URI, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      retries++;
      console.error(
        `MongoDB connection failed (attempt ${retries}/${maxRetries}): ${error.message}`,
      );

      if (retries === 2) {
        console.log("Switching DNS to Google fallback");
        dns.setServers(fallbackDNS);
      }

      if (retries < maxRetries) {
        const waitTime = Math.min(1000 * 2 ** (retries - 1), 15000);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error("Failed to connect to MongoDB after maximum retries");
};
