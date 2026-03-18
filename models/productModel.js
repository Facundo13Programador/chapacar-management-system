import mongoose from 'mongoose';

function simpleSlug(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const imageSchema = new mongoose.Schema(
  {
    url:    { type: String, required: true },
    alt:    { type: String, default: '' },
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    iva: {
      type: Number,
      default: 22,
      min: 0,
      max: 100,
    },
    countInStock: {
      type: Number,
      required: true,
      min: 0,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'brand',
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true,
      },
    ],
    images: [imageSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (!this.slug && this.name) this.slug = simpleSlug(this.name);
  if (this.iva == null || this.iva !== 22) {
    this.iva = 22;
  }
  next();
});

productSchema.methods.ensureSingleMainImage = function () {
  let mainFound = false;
  this.images = this.images.map((img) => {
    if (img.isMain && !mainFound) {
      mainFound = true;
      return img;
    }
    return { ...(img.toObject?.() ?? img), isMain: false };
  });
};

const Product = mongoose.model('Product', productSchema);
export default Product;
