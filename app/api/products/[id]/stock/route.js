import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// PATCH — Add stock quantity
export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const { id } = await params;
        const { action, quantity } = await request.json();
        const qty = parseInt(quantity);

        if (!qty || qty <= 0) {
            return Response.json({ error: 'Invalid quantity' }, { status: 400 });
        }

        const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
        if (!product) {
            return Response.json({ error: 'Product not found' }, { status: 404 });
        }

        let newQty;
        if (action === 'add') {
            newQty = (product.stockQuantity || 0) + qty;
        } else if (action === 'set') {
            newQty = qty;
        } else {
            return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            { $set: { stockQuantity: newQty, updatedAt: new Date() } }
        );

        return Response.json({ success: true, stockQuantity: newQty });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}