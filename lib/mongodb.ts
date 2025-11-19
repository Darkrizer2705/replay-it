import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in .env.local");
}

let cached = (global as any)._mongo as {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<Db> | null;
} | undefined;

if (!cached) {
  cached = (global as any)._mongo = { client: null, db: null, promise: null };
}

export async function connectDB(): Promise<Db> {
  if (cached!.db) {
    return cached!.db!;
  }

  if (!cached!.promise) {
    const client = new MongoClient(MONGODB_URI!);
    cached!.promise = client.connect().then((cli) => {
      cached!.client = cli;
      const db = cli.db("mahindra");
      cached!.db = db;
      console.log("✅ Connected to MongoDB");
      return db;
    });
  }

  cached!.db = await cached!.promise;
  return cached!.db!;
}
