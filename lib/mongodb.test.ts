import { describe, it, expect, beforeEach, afterEach, inject } from 'vitest';
import mongoose from 'mongoose';
import { connect, disconnect, getMongoUri } from '@/lib/mongodb';

describe('lib/mongodb', () => {
  describe('getMongoUri', () => {
    const originalUri = process.env.MONGODB_URI;

    beforeEach(() => {
      delete process.env.MONGODB_URI;
    });

    afterEach(() => {
      if (originalUri !== undefined) {
        process.env.MONGODB_URI = originalUri;
      }
    });

    it('throws when MONGODB_URI is missing', () => {
      expect(() => getMongoUri()).toThrow(/MONGODB_URI/);
    });

    it('throws when MONGODB_URI is empty', () => {
      process.env.MONGODB_URI = '';
      expect(() => getMongoUri()).toThrow(/MONGODB_URI/);
    });

    it('returns the URI when set', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      expect(getMongoUri()).toBe('mongodb://localhost:27017/test');
    });
  });

  describe('connect', () => {
    afterEach(async () => {
      await disconnect();
    });

    it('connects to MongoDB using the provided URI', async () => {
      const mongoUri = inject('mongoUri');
      await connect(mongoUri);
      expect(mongoose.connection.readyState).toBe(1);
    });

    it('caches the connection on subsequent calls', async () => {
      const mongoUri = inject('mongoUri');
      const result1 = await connect(mongoUri);
      const result2 = await connect(mongoUri);
      expect(result1).toBe(result2);
    });

    it('defaults to getMongoUri when no URI is provided', async () => {
      process.env.MONGODB_URI = inject('mongoUri');
      try {
        const result = await connect();
        expect(result).toBeDefined();
      } finally {
        delete process.env.MONGODB_URI;
      }
    });
  });

  describe('disconnect', () => {
    afterEach(async () => {
      await disconnect();
    });

    it('clears the cache so a subsequent connect succeeds', async () => {
      const mongoUri = inject('mongoUri');
      await connect(mongoUri);
      await disconnect();
      await expect(connect(mongoUri)).resolves.toBeDefined();
    });
  });
});
