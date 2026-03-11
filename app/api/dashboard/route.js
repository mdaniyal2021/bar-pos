import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';

export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = db.collection('orders');
        const products = db.collection('products');
        const categories = db.collection('categories');

        // Today stats
        const todayOrdersList = await orders.find({
            status: 'completed',
            createdAt: { $gte: today }
        }).toArray();

        const todayOrders = todayOrdersList.length;
        const todayRevenue = todayOrdersList.reduce((sum, o) => sum + o.totalAmount, 0);

        // Total stats
        const allOrders = await orders.find({ status: 'completed' }).toArray();
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        // Products & Categories
        const totalProducts = await products.countDocuments({ isActive: true });
        const totalCategories = await categories.countDocuments({ isActive: true });

        // Recent orders
        const recentOrders = await orders
            .find({})
            .sort({ createdAt: -1 })
            .limit(8)
            .toArray();

        return Response.json({
            todayOrders,
            todayRevenue,
            totalOrders,
            totalRevenue,
            totalProducts,
            totalCategories,
            recentOrders,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
