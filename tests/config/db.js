/**
 * Conexión a BD para tests.
 * - Con MONGO_DB_URI: usa MongoDB real con dbName = MONGO_DB_NAME_TEST o 'training_test'.
 * - Con USE_MEMORY_DB=1: usa mongodb-memory-server (requiere permisos de red).
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

let mongoServer;

export async function connectTestDb() {
  const useMemory = process.env.USE_MEMORY_DB === '1';

  if (useMemory) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    return uri;
  }

  const uri = process.env.MONGO_DB_URI;
  const dbName = process.env.MONGO_DB_NAME_TEST || 'training_test';
  if (!uri) {
    throw new Error('Para tests: define MONGO_DB_URI en .env o USE_MEMORY_DB=1');
  }
  await mongoose.connect(uri, { dbName });
  return uri;
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}
