/**
 * Helpers para tests: limpieza de colecciones y datos virtuales precargados (fixtures).
 */
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb } from './db.js';
import { COLLECTIONS_TO_CLEAR } from './common.js';

export async function beforeTestSuite() {
  await connectTestDb();
}

export async function afterTestSuite() {
  await disconnectTestDb();
}

export async function clearCollections() {
  const collections = await mongoose.connection.db.collections();
  const toClear = collections.filter((c) =>
    COLLECTIONS_TO_CLEAR.includes(c.collectionName)
  );
  await Promise.all(toClear.map((c) => c.deleteMany({})));
}

/**
 * Datos virtuales precargados para tests de modelos
 */
export const fixtures = {
  user: {
    name: 'Usuario Test',
    email: 'test@example.com',
    password: 'password123',
    role: 'client',
    isAdmin: false,
  },
  userAdmin: {
    name: 'Admin Test',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'system_admin',
    isAdmin: true,
  },
  category: {
    name: 'Filtros de aceite',
    slug: 'filtros-de-aceite',
  },
  category2: {
    name: 'Pastillas de freno',
    slug: 'pastillas-de-freno',
  },
  brand: {
    name: 'Bosch',
    slug: 'bosch',
    models: ['ABC-100', 'XYZ-200'],
  },
  brand2: {
    name: 'Gates',
    slug: 'gates',
    models: [],
  },
  product: (brandId, categoryIds) => ({
    name: 'Filtro de aceite premium',
    code: 'FIL-ACE-001',
    slug: 'filtro-de-aceite-premium',
    description: 'Filtro de aceite de alta calidad',
    price: 25.5,
    countInStock: 50,
    brand: brandId,
    categories: categoryIds,
  }),
  order: (userId, productId) => ({
    user: userId,
    items: [
      { product: productId, name: 'Filtro aceite', price: 25.5, qty: 2 },
    ],
    phone: '+54 11 1234-5678',
    address: 'Calle Falsa 123',
    notes: 'Entregar por la tarde',
    paymentMethod: 'transferencia',
    deliveryMethod: 'envio',
    subtotal: 51,
    total: 51,
    status: 'pending',
  }),
};
