import mongoose from 'mongoose';

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    throw new Error('MONGODB_URI is not set. Please configure it in .env.local.');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache =
  globalThis.__mongoose ??
  (globalThis.__mongoose = { conn: null, promise: null });

export async function connect(uri?: string): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (cached.promise) {
    return cached.promise;
  }

  const mongoUri = uri ?? getMongoUri();
  cached.promise = mongoose.connect(mongoUri, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnect(): Promise<void> {
  try {
    await mongoose.disconnect();
  } finally {
    cached.promise = null;
    cached.conn = null;
  }
}
