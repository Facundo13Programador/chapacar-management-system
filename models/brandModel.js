import mongoose from 'mongoose';

function simpleSlug(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    models: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

brandSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = simpleSlug(this.name);
  }
  next();
});

brandSchema.virtual('modelsCount').get(function () {
  return Array.isArray(this.models) ? this.models.length : 0;
});

const Brand = mongoose.model('brand', brandSchema);
export default Brand;
