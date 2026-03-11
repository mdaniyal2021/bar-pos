import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// GET — All orders with filters
export async function GET(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        const filter = {};

        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: start, $lte: end };
        }

        if (status) filter.status = status;

        const orders = await db.collection('orders')
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();

        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        return Response.json({
            orders,
            totalOrders: completedOrders.length,
            totalRevenue,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create new order
export async function POST(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const body = await request.json();

        const { cashierId, cashierName, items } = body;

        if (!items || items.length === 0) {
            return Response.json({ error: 'No items in order' }, { status: 400 });
        }

        // Generate order number
        const lastOrder = await db.collection('orders')
            .findOne({}, { sort: { createdAt: -1 } });

        let nextNum = 1;
        if (lastOrder?.orderNumber) {
            const lastNum = parseInt(lastOrder.orderNumber.replace('ORD-', ''));
            nextNum = lastNum + 1;
        }
        const orderNumber = `ORD-${String(nextNum).padStart(5, '0')}`;

        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

        const order = {
            orderNumber,
            cashierId: cashierId,
            cashierName,
            items,
            totalAmount,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('orders').insertOne(order);

        return Response.json({
            message: 'Order created successfully!',
            order: { ...order, _id: result.insertedId },
        }, { status: 201 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}