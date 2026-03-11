import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await connectDB();

        // Direct mongoose collection use karo — model bypass
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Sab delete karo
        await usersCollection.deleteMany({});

        // Password manually hash karo
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Direct insert karo
        await usersCollection.insertMany([
            {
                name: 'Super Admin',
                email: 'admin@bar.com',
                password: hashedPassword,
                role: 'super_admin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'Cashier One',
                email: 'cashier@bar.com',
                password: hashedPassword,
                role: 'cashier',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();

        return Response.json({
            message: 'Users seeded successfully!',
            users,
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}