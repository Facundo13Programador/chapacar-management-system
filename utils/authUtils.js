import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const ADMIN_ROLES = ['system_admin', 'bussiness_admin', 'operator'];

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES;
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES;     

export const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role || "client",
    },
    ACCESS_SECRET, 
    {
      expiresIn: ACCESS_EXPIRES, 
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role || "client",
    },
    REFRESH_SECRET, 
    {
      expiresIn: REFRESH_EXPIRES,
    }
  );
};

export const isAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    console.error("No Token");
    return res.status(401).send({ message: "No Token" });
  }

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : authorization;

  if (!token) {
    console.error("Token is empty");
    return res.status(401).send({ message: "Invalid Token" });
  }

  try {
    const decodedToken = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      console.error("Wrong user in Token");
      return res.status(401).send({ message: "Invalid Token" });
    }

    req.user = {
      id: user._id.toString(),      
      _id: user._id.toString(),     
      name: user.name,
      email: user.email,
      role: user.role || "client",
      isAdmin: !!user.isAdmin,
    };

    next();
  } catch (err) {

    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    console.error(">>>>>>isAuth", err);
    res.status(401).send({ message: "Invalid Token" });
  }
};

const userIsAdmin = (user) => {
  return !!(user.role && ADMIN_ROLES.includes(user.role));
};

export const isAdmin = (req, res, next) => {
  if (req.user && userIsAdmin(req.user)) {
    next();
  } else {
    res
      .status(403)
      .send({ message: "No tienes permisos de administrador", req: req.user });
  }
};

export const isSystemAdmin = (req, res, next) => {
  if (req.user && req.user.role === "system_admin") {
    next();
  } else {
    res
      .status(403)
      .send({
        message: "No tienes permisos de system_admin",
        req: req.user,
      });
  }
};

export const isAdminOrOperator = (req, res, next) => {
  if (req.user && userIsAdmin(req.user)) {
    return next();
  }

  return res.status(403).send({
    message: "No tienes permisos para gestionar reservas",
    req: req.user,
  });
};

