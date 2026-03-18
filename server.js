import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import budgetRoutes from "./routes/budgetRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import chatBotRoutes from "./routes/chatBotRoutes.js";
import workOrderRoutes from "./routes/workOrderRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import forumRouter from "./routes/forumRoutes.js";
import siteSettingsRouter from "./routes/siteSettingsRoutes.js";
import { isAuth } from "./utils/authUtils.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  process.env.FRONTEND_URL,
].filter(Boolean);


const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);


    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));
const mongo_uri = process.env.MONGO_DB_URI;
const options = { dbName: process.env.MONGO_DB_NAME };

mongoose
  .connect(mongo_uri, options)
  .then(() => console.info("connected to db:", mongoose.connection.name))
  .catch((err) => {
    console.error("Mongo error:", err.message);
    process.exit(1);
  });

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/brands", brandRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/vehicles", isAuth, vehicleRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/chat", chatBotRoutes);
app.use("/api/orders", orderRouter);
app.use("/api/forum", forumRouter);
app.use("/api/site-settings", siteSettingsRouter);
app.get("/api/health", (req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "frontend", "build");

  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => res.send("API running"));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.info(`serve at http://localhost:${port}`));
