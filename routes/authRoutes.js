// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import crypto from 'crypto';
import { sendMail } from '../utils/mail.js';

const router = express.Router();

/**
 * Middleware de autenticación
 * Lee el token de Authorization: Bearer <token>
 * y deja el payload del usuario en req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta token' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const u = await User.findOne({ email }).select('+password');
    if (!u) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const user = { id: u._id, name: u.name, email: u.email, role: u.role };

    const accessToken = jwt.sign(
      user,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_EXPIRES || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: u._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.REFRESH_EXPIRES || '30d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 1000 * 60 * 60 * 24 * 30, 
    });

    return res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
});




router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const u = await User.findById(decoded.id);
    if (!u) return res.status(401).json({ message: 'Usuario inválido' });

    const user = { id: u._id, name: u.name, email: u.email, role: u.role };

    const accessToken = jwt.sign(
      user,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_EXPIRES || '15m' }
    );

    return res.json({ user, accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Refresh inválido o expirado' });
  }
});





router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', {
    path: '/api/auth',
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.sendStatus(204);
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: 'Nombre, email y contraseña son requeridos' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'El email ya está registrado' });

    const u = new User({ name, email, password });
    await u.save();

    const token = crypto.randomBytes(32).toString('hex');
    u.emailVerificationToken = token;
    u.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); 
    await u.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendMail({
      to: u.email,
      subject: 'Confirma tu cuenta - Chapacar',
      html: `
        <p>Hola ${u.name},</p>
        <p>Gracias por registrarte en Chapacar Repuestos.</p>
        <p>Por favor, confirma tu cuenta haciendo clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}" target="_blank">Confirmar mi cuenta</a></p>
        <p>Si no creaste esta cuenta, puedes contactar a soporte@chapacar.com.ar.</p>
      `,
    });

    const user = { id: u._id, name: u.name, email: u.email, role: u.role };

    const accessToken = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.ACCESS_EXPIRES || '15m',
    });

    res.status(201).json({ user, accessToken });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    next(err);
  }
});


// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token requerido' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Token inválido o expirado' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.json({ message: 'Email verificado correctamente. Ya podés usar tu cuenta.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'Si el email existe, se enviará un enlace de recuperación.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const resetUrl = `${baseUrl}/reset-password/${token}`;


    await sendMail({
      to: user.email,
      subject: 'Recuperar contraseña - Chapacar',
      html: `
        <p>Hola ${user.name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Puedes hacerlo desde este enlace (válido por 1 hora):</p>
        <p><a href="${resetUrl}" target="_blank">Restablecer contraseña</a></p>
        <p>Si no fuiste tú, ignora este correo.</p>
      `,
    });

    res.json({
      message: 'Si el email existe, se enviará un enlace de recuperación.',
    });
  } catch (err) {
    next(err);
  }
});


// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: 'Token y nueva contraseña son requeridos' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password'); 

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Token inválido o expirado' });
    }

    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
});


export default router;
