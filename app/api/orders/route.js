import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET — All orders
export async function GET(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 50;
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const paymentMethod = searchParams.get('paymentMethod');

        const query = {};
        if (session.user.role !== 'super_admin') query.cashierId = session.user.id;
        if (status) query.status = status;
        if (paymentMethod) query.paymentMethod = paymentMethod;
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); query.createdAt.$lte = to; }
        }

        const skip = (page - 1) * limit;
        const total = await db.collection('orders').countDocuments(query);
        const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();

        return Response.json({ orders, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create order + deduct stock
export async function POST(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const session = await getServerSession(authOptions);
        if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { items, paymentMethod, amountReceived, changeAmount } = body;

        if (!items || !items.length) return Response.json({ error: 'Order must have at least one item' }, { status: 400 });
        if (!paymentMethod || !['cash', 'bank'].includes(paymentMethod)) return Response.json({ error: 'Invalid payment method' }, { status: 400 });

        const totalAmount = items.reduce((sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity), 0);

        if (paymentMethod === 'cash') {
            const received = parseFloat(amountReceived) || 0;
            if (received < totalAmount) return Response.json({ error: 'Amount received is less than total' }, { status: 400 });
        }

        // Order number
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayCount = await db.collection('orders').countDocuments({ createdAt: { $gte: todayStart } });
        const orderNumber = `ORD-${dateStr}-${String(todayCount + 1).padStart(4, '0')}`;

        const received = paymentMethod === 'cash' ? parseFloat(amountReceived) : totalAmount;
        const change = paymentMethod === 'cash' ? received - totalAmount : 0;

        const newOrder = {
            orderNumber,
            cashierId: session.user.id,
            cashierName: session.user.name,
            paymentMethod,
            amountReceived: received,
            changeAmount: change,
            items: items.map(item => ({
                productId: item.productId,
                productOptionId: item.productOptionId,
                productName: item.productName,
                optionName: item.optionName,
                unitPrice: parseFloat(item.unitPrice),
                quantity: parseInt(item.quantity),
                subtotal: parseFloat(item.subtotal),
            })),
            totalAmount,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('orders').insertOne(newOrder);

        // Deduct stock for each item
        for (const item of items) {
            if (!item.productId) continue;
            try {
                const productId = new ObjectId(item.productId);
                const product = await db.collection('products').findOne({ _id: productId });
                if (product && product.stockEnabled && product.stockQuantity > 0) {
                    const newQty = Math.max(0, (product.stockQuantity || 0) - parseInt(item.quantity));
                    await db.collection('products').updateOne(
                        { _id: productId },
                        { $set: { stockQuantity: newQty, updatedAt: new Date() } }
                    );
                }
            } catch (e) {
                // Stock deduction fail hone par order cancel nahi hoga
                console.error('Stock deduction error:', e.message);
            }
        }

        return Response.json({ success: true, order: { ...newOrder, _id: result.insertedId } }, { status: 201 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}