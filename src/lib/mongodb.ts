import mongoose from "mongoose";
import dns from "dns";

// Configure reliable DNS servers (Google & Cloudflare) to prevent ESERVFAIL on mongodb+srv TXT record lookups
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("DNS server setup warning:", dnsErr);
}

const MONGODB_URI = process.env.MONGODB_URI || "";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables.");
    return null;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ Connected exclusively to MongoDB Atlas:", MONGODB_URI.split("@")[1]);
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB Atlas connection error:", e);
    return null;
  }

  return cached.conn;
}
