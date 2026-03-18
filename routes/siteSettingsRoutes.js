// routes/siteSettingsRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import SiteSettings from "../models/siteSettingsModel.js";
import { requirePermission, SCOPES } from "../utils/permissions.js";

const siteSettingsRouter = express.Router();

// Middleware de auth 
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No autenticado: falta token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded; 
    next();
  } catch (err) {
    console.error("JWT error (siteSettings):", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

const getOrCreateSettings = async () => {
  let doc = await SiteSettings.findOne();
  if (!doc) doc = await SiteSettings.create({});
  return doc;
};

// GET /api/site-settings/public
siteSettingsRouter.get("/public", async (req, res, next) => {
  try {
    const doc = await getOrCreateSettings();

    const carousel = (doc.carousel || [])
      .filter((x) => x.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const faqs = (doc.faqs || [])
      .filter((x) => x.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      company: doc.company || {},
      contact: doc.contact || {},
      location: doc.location || {},
      carousel,
      faqs,
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/site-settings
siteSettingsRouter.get(
  "/",
  authenticate,
  requirePermission("siteSettings", [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const doc = await getOrCreateSettings();
      res.json(doc);
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/site-settings

siteSettingsRouter.put(
  "/",
  authenticate,
  requirePermission("siteSettings", [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const doc = await getOrCreateSettings();

      const { company, contact, location, carousel, faqs } = req.body || {};

      if (company && typeof company === "object") {
        doc.company = { ...(doc.company || {}), ...company };
      }

      if (contact && typeof contact === "object") {
        doc.contact = { ...(doc.contact || {}), ...contact };
      }

      if (location && typeof location === "object") {
        doc.location = { ...(doc.location || {}), ...location };
      }

      if (Array.isArray(carousel)) {
        for (const [idx, slide] of carousel.entries()) {
          if (!slide?.image || !String(slide.image).trim()) {
            return res.status(400).json({
              message: `Carousel: falta "image" en el item #${idx + 1}`,
            });
          }
        }
        doc.carousel = carousel;
      }

      if (Array.isArray(faqs)) {
        for (const [idx, f] of faqs.entries()) {
          if (!f?.question || !String(f.question).trim()) {
            return res.status(400).json({
              message: `FAQ: falta "question" en el item #${idx + 1}`,
            });
          }
          if (!f?.answer || !String(f.answer).trim()) {
            return res.status(400).json({
              message: `FAQ: falta "answer" en el item #${idx + 1}`,
            });
          }
        }
        doc.faqs = faqs;
      }

      if (req.user?.id) doc.updatedBy = req.user.id;

      const saved = await doc.save();
      res.json(saved);
    } catch (e) {
      next(e);
    }
  }
);

export default siteSettingsRouter;
