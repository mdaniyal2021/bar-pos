import mongoose from 'mongoose';

const OptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
});

const ProductSchema = new mongoose.Schema({
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, unique: true, trim: true },
    image: { type: String, default: null },
    options: [OptionSchema],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);