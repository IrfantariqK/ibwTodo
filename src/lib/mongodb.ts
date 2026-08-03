import mongoose from "mongoose";
import dns from "dns";

// Configure reliable DNS servers (Google & Cloudflare) to prevent ESERVFAIL on mongodb+srv TXT record lookups
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (dnsErr) {
  console.warn("DNS server setup warning:", dnsErr);
}

const PRIMARY_URI = process.env.MONGODB_URI || "";

// Direct seedlist fallback connection string if mongodb+srv TXT lookup fails on local ISP
const FALLBACK_URI = "mongodb://irfan992990_db_user:gXMSHWBlBYZdajQB@cluster0-shard-00-00.wow0lt3.mongodb.net:27017,cluster0-shard-00-01.wow0lt3.mongodb.net:27017,cluster0-shard-00-02.wow0lt3.mongodb.net:27017/taskconnect?ssl=true&replicaSet=atlas-wow0lt3-shard-0&authSource=admin&retryWrites=true&w=majority";

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
  if (!PRIMARY_URI) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(PRIMARY_URI, opts)
      .catch(async (primaryErr) => {
        console.warn("Primary mongodb+srv lookup failed, attempting direct shard seedlist connection...", primaryErr?.message || primaryErr);
        return mongoose.connect(FALLBACK_URI, opts);
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ Successfully connected to MongoDB Atlas database");
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB Atlas connection error:", e);
    return null;
  }

  return cached.conn;
}
