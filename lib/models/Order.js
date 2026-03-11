import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productOptionId: { type: String },
    productName: { type: String, required: true },
    optionName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
    orderNumber: { type: String, required: true, unique: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName: { type: String },
    items: [ItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'voided'], default: 'completed' },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);