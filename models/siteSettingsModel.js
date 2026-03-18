import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const carouselSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    link: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    company: {
      name: { type: String, default: "CHAPACAR" },
      about: { type: String, default: "" },
      hours: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
    },
    contact: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
    location: {
      mapsUrl: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number },
    },
    carousel: [carouselSchema],
    faqs: [faqSchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

siteSettingsSchema.index({}, { unique: false });

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
export default SiteSettings;
