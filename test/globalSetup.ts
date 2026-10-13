import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export default async function globalSetup(context: {
  provide: (key: string, value: unknown) => void;
}) {
  try {
    mongod = await MongoMemoryServer.create({
      binary: {
        version: '7.0.14',
      },
      instance: {
        launchTimeout: 30000,
      },
    });
  } catch (error) {
    console.error('Failed to start MongoMemoryServer:', error);
    throw error;
  }

  context.provide('mongoUri', mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
