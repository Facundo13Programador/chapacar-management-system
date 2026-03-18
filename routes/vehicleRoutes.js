// routes/vehicleRoutes.js
import express from 'express';
import Vehicle from '../models/vehicleModel.js';

const router = express.Router();

// helper para leer el id del usuario desde el token
function getUserIdFromReq(req) {
  return req.user?._id || req.user?.id || null;
}

// GET /api/vehicles/my

router.get('/my', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({
        message: 'No se pudo identificar al usuario (sin id en token).',
      });
    }

    const vehicles = await Vehicle.find({ owner: userId })
      .populate('brand', 'name models')
      .sort({ createdAt: -1 });

    res.json(vehicles);
  } catch (err) {
    console.error('listMyVehicles error', err);
    res.status(500).json({ message: 'No se pudieron cargar los vehículos' });
  }
});

// POST /api/vehicles/my

router.post('/my', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({
        message: 'No se pudo identificar al usuario (sin id en token).',
      });
    }

    const {
      brandId,
      model,
      year,
      licensePlate,
      vin,
      engine,
      fuelType,
      color,
      notes,
    } = req.body;

    if (!brandId || !model) {
      return res.status(400).json({
        message: 'Marca y modelo son obligatorios.',
      });
    }

    const vehicle = await Vehicle.create({
      owner: userId,
      brand: brandId,
      model,
      year,
      licensePlate,
      vin,
      engine,
      fuelType,
      color,
      notes,
    });

    await vehicle.populate('brand', 'name models');

    res.status(201).json(vehicle);
  } catch (err) {
    console.error('createMyVehicle error', err);
    res.status(400).json({
      message: err.message || 'No se pudo crear el vehículo',
    });
  }
});

// PUT /api/vehicles/my/:id

router.put('/my/:id', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({
        message: 'No se pudo identificar al usuario (sin id en token).',
      });
    }

    const { id } = req.params;

    const vehicle = await Vehicle.findOne({ _id: id, owner: userId });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const allowed = [
      'model',
      'year',
      'licensePlate',
      'vin',
      'engine',
      'fuelType',
      'color',
      'notes',
    ];

    for (const field of allowed) {
      if (field in req.body) {
        vehicle[field] = req.body[field];
      }
    }

    if (req.body.brandId) {
      vehicle.brand = req.body.brandId;
    }

    await vehicle.save();
    await vehicle.populate('brand', 'name models');

    res.json(vehicle);
  } catch (err) {
    console.error('updateMyVehicle error', err);
    res.status(400).json({
      message: err.message || 'No se pudo actualizar el vehículo',
    });
  }
});

// DELETE /api/vehicles/my/:id

router.delete('/my/:id', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({
        message: 'No se pudo identificar al usuario (sin id en token).',
      });
    }

    const { id } = req.params;

    const vehicle = await Vehicle.findOneAndDelete({
      _id: id,
      owner: userId,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    console.error('deleteMyVehicle error', err);
    res.status(400).json({
      message: err.message || 'No se pudo eliminar el vehículo',
    });
  }
});

export default router;
