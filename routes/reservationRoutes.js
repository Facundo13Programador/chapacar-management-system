// routes/reservationRoutes.js
import express from "express";
import Reservation from "../models/reservationModel.js";
import Vehicle from "../models/vehicleModel.js";
import { sendMail } from "../utils/mail.js";
import { isAuth, isAdminOrOperator } from "../utils/authUtils.js";

const router = express.Router();

// POST /api/reservations (cliente crea)
router.post("/", isAuth, async (req, res, next) => {
  try {
    const { serviceType, dateTime, notes, vehicleId } = req.body;

    if (!serviceType || !dateTime || !vehicleId) {
      return res.status(400).json({
        message: "Faltan datos de la reserva (tipo, fecha u vehículo).",
      });
    }

    const clientId = req.user?._id || req.user?.id;
    if (!clientId) {
      return res
        .status(401)
        .json({ message: "No se pudo identificar al usuario (sin id en token)." });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: clientId });
    if (!vehicle) {
      return res.status(400).json({
        message: "El vehículo seleccionado no existe o no pertenece a tu cuenta.",
      });
    }

    const date = new Date(dateTime);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Fecha inválida." });
    }

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      return res
        .status(400)
        .json({ message: "No se pueden crear reservas en días pasados." });
    }

    const dayOfWeek = selected.getDay();
    if (dayOfWeek === 5) {
      return res
        .status(400)
        .json({ message: "El taller está cerrado los sábados. Elige otro día." });
    }
    if (dayOfWeek === 6) {
      return res
        .status(400)
        .json({ message: "El taller está cerrado los domingos. Elige otro día." });
    }

    // límite de 15 reservas por día (excepto canceladas)
    const nextDay = new Date(selected);
    nextDay.setDate(nextDay.getDate() + 1);

    const countForDay = await Reservation.countDocuments({
      dateTime: { $gte: selected, $lt: nextDay },
      status: { $ne: "cancelled" },
    });

    if (countForDay >= 15) {
      return res.status(400).json({
        message:
          "No hay más turnos disponibles para ese día. Por favor, elige otra fecha.",
      });
    }

    const reservation = await Reservation.create({
      client: clientId,
      vehicle: vehicle._id,
      serviceType,
      dateTime: selected,
      notes: notes || "",
    });

    res.status(201).json(reservation);
  } catch (e) {
    next(e);
  }
});

// GET /api/reservations/mine (cliente ve las suyas)
router.get("/mine", isAuth, async (req, res, next) => {
  try {
    const clientId = req.user?._id || req.user?.id;
    if (!clientId) {
      return res
        .status(401)
        .json({ message: "No se pudo identificar al usuario (sin id en token)." });
    }

    const reservations = await Reservation.find({ client: clientId })
      .populate({
        path: "vehicle",
        populate: { path: "brand", select: "name" },
      })
      .sort({ dateTime: 1 });

    res.json(reservations);
  } catch (e) {
    next(e);
  }
});

// GET /api/reservations/for-budget (admin/operator)
router.get("/for-budget", isAuth, isAdminOrOperator, async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      serviceType: { $in: ["revision", "full_service"] },
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("client", "name email")
      .populate({
        path: "vehicle",
        populate: { path: "brand", select: "name" },
      })
      .sort({ dateTime: 1 });

    res.json(reservations);
  } catch (e) {
    next(e);
  }
});


// GET /api/reservations (taller/admin ve todas)
router.get("/", isAuth, isAdminOrOperator, async (req, res, next) => {
  try {
    const reservations = await Reservation.find()
      .populate("client", "name email")
      .populate({
        path: "vehicle",
        populate: { path: "brand", select: "name" },
      })
      .sort({ dateTime: 1 });

    res.json(reservations);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/reservations/:id/status (admin/operator cambia estado)
router.patch("/:id/status", isAuth, isAdminOrOperator, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido." });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("client", "name email")
      .populate({
        path: "vehicle",
        populate: { path: "brand", select: "name" },
      });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    try {
      if (["confirmed", "cancelled"].includes(status) && reservation.client?.email) {
        const clientName = reservation.client.name || "cliente";
        const to = reservation.client.email;

        const dateStr = reservation.dateTime.toLocaleDateString("es-UY", {
          dateStyle: "full",
        });

        const typeLabel =
          reservation.serviceType === "revision" ? "Revisión" : "Service completo";

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        let subject;
        let html;

        if (status === "confirmed") {
          subject = "Tu reserva en Chapacar fue CONFIRMADA";
          html = `
            <p>Hola ${clientName},</p>
            <p>Te confirmamos tu reserva en el taller <strong>Chapacar</strong>.</p>
            <p>
              <strong>Fecha:</strong> ${dateStr}<br/>
              <strong>Tipo de servicio:</strong> ${typeLabel}<br/>
            </p>
            ${reservation.notes
              ? `<p><strong>Comentarios que nos enviaste:</strong> ${reservation.notes}</p>`
              : ""
            }
            <p>Puedes revisar tus reservas ingresando a tu cuenta:</p>
            <p><a href="${frontendUrl}/reservations" target="_blank">Ver mis reservas</a></p>
            <p>Muchas gracias por confiar en nosotros.<br/>Chapacar Repuestos & Taller</p>
          `;
        } else if (status === "cancelled") {
          subject = "Tu reserva en Chapacar fue CANCELADA";
          html = `
            <p>Hola ${clientName},</p>
            <p>Lamentamos informarte que tu reserva en el taller <strong>Chapacar</strong> fue <strong>cancelada</strong>.</p>
            <p>
              <strong>Fecha:</strong> ${dateStr}<br/>
              <strong>Tipo de servicio:</strong> ${typeLabel}<br/>
            </p>
            <p>Si deseas coordinar una nueva fecha, puedes ingresar a tu cuenta y realizar una nueva reserva:</p>
            <p><a href="${frontendUrl}/reservations" target="_blank">Realizar una nueva reserva</a></p>
            <p>Chapacar Repuestos & Taller</p>
          `;
        }

        if (subject && html) {
          await sendMail({ to, subject, html });
        }
      }
    } catch (mailErr) {
      console.error("Error enviando email de cambio de estado de reserva", mailErr);
    }

    res.json(reservation);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/reservations/:id/cancel (cliente cancela la suya)
router.patch("/:id/cancel", isAuth, async (req, res, next) => {
  try {
    const clientId = req.user?._id || req.user?.id;
    if (!clientId) {
      return res
        .status(401)
        .json({ message: "No se pudo identificar al usuario (sin id en token)." });
    }

    const reservation = await Reservation.findOne({
      _id: req.params.id,
      client: clientId,
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    if (reservation.status === "completed") {
      return res
        .status(400)
        .json({ message: "No se puede cancelar una reserva completada." });
    }

    reservation.status = "cancelled";
    await reservation.save();

    res.json(reservation);
  } catch (e) {
    next(e);
  }
});

export default router;
