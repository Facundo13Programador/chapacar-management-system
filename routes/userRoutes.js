// routes/userRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';

import User from '../models/userModel.js';
import { requirePermission, SCOPES } from '../utils/permissions.js';

const userRouter = express.Router();

// almacenamiento simple de avatars
const upload = multer({ dest: 'uploads/avatars/' });

// Middleware de auth
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta token' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // decoded debería tener { id, ... }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error (users):', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// GET /api/users/me  -> datos del usuario logueado
userRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// PUT /api/users/me  -> actualizar nombre / email

userRouter.put('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { name, email, phone } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      isAdmin: updated.isAdmin,
      avatarUrl: updated.avatarUrl,
      phone: updated.phone,
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Email ya está en uso' });
    }
    next(e);
  }
});


// PUT /api/users/me/password  -> cambiar contraseña
userRouter.put('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Contraseña actual incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada' });
  } catch (e) {
    next(e);
  }
});

// POST /api/users/me/avatar  -> subir foto de perfil
userRouter.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: 'No se recibió ningún archivo' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.save();

      res.json({ avatarUrl: user.avatarUrl });
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/users/me/request-mechanic

userRouter.post(
  '/me/request-mechanic',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (['operator', 'bussiness_admin', 'system_admin'].includes(user.role)) {
        return res
          .status(400)
          .json({ message: 'Ya tienes un rol de taller asignado' });
      }

      if (user.roleRequestStatus === 'pending') {
        return res
          .status(400)
          .json({ message: 'Ya tienes una solicitud pendiente' });
      }

      user.requestedRole = 'operator';
      user.roleRequestStatus = 'pending';
      user.roleRequestedAt = new Date();

      await user.save();
      res.json({ message: 'Solicitud enviada correctamente' });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/users/role-requests

userRouter.get(
  '/role-requests',
  authenticate,
  requirePermission('users', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const list = await User.find({ roleRequestStatus: 'pending' }).select(
        '_id name email role requestedRole roleRequestedAt'
      );
      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/users/:id/role-request  (aprobar / rechazar)

userRouter.post(
  '/:id/role-request',
  authenticate,
  requirePermission('users', [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Acción inválida' });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (user.roleRequestStatus !== 'pending') {
        return res
          .status(400)
          .json({ message: 'El usuario no tiene solicitud pendiente' });
      }

      if (action === 'approve') {
        const newRole = user.requestedRole || 'operator';
        user.role = newRole;
        user.isAdmin = ['system_admin', 'bussiness_admin'].includes(newRole);
        user.roleRequestStatus = 'approved';
      } else {
        user.roleRequestStatus = 'rejected';
      }

      user.roleReviewedAt = new Date();
      user.roleReviewedBy = req.user.id;
      user.requestedRole = null;

      const updated = await user.save();

      res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        roleRequestStatus: updated.roleRequestStatus,
      });
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/users  (listado)

userRouter.get(

  '/',
  authenticate,
  requirePermission('users', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const users = await User.find({})
        .select('_id name email role isAdmin createdAt updatedAt')
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/users/:id

userRouter.get(
  '/:id',
  authenticate,
  requirePermission('users', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id).select(
        '_id name email role isAdmin createdAt updatedAt'
      );

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/users/:id

userRouter.put(
  '/:id',
  authenticate,
  requirePermission('users', [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email, role, isAdmin } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (role !== undefined) user.role = role;

      if (isAdmin !== undefined) {
        user.isAdmin = isAdmin;
      } else if (role !== undefined) {
        user.isAdmin = ['system_admin', 'bussiness_admin'].includes(role);
      }

      const updated = await user.save();

      res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isAdmin: updated.isAdmin,
      });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ message: 'Email ya está en uso' });
      }
      next(e);
    }
  }
);

export default userRouter;
