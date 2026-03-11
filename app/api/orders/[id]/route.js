import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// GET — Single order
export async function GET(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        const order = await db.collection('orders').findOne({
            _id: new ObjectId(id)
        });

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        return Response.json(order);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — Void order
export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        await db.collection('orders').updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: 'voided', updatedAt: new Date() } }
        );

        return Response.json({ message: 'Order voided successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}