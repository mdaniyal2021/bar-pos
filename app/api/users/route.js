import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// GET — All users
export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const users = await db.collection('users')
            .find({}, { projection: { password: 0 } })
            .sort({ role: 1, name: 1 })
            .toArray();

        return Response.json(users);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create user
export async function POST(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const body = await request.json();

        // Validation
        if (!body.name?.trim()) {
            return Response.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!body.email?.trim()) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }
        if (!body.password || body.password.length < 6) {
            return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }
        if (!['super_admin', 'cashier'].includes(body.role)) {
            return Response.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check duplicate email
        const existing = await db.collection('users').findOne({
            email: body.email.toLowerCase().trim()
        });
        if (existing) {
            return Response.json({ error: 'Email already exists' }, { status: 400 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.password, salt);

        const user = {
            name: body.name.trim(),
            email: body.email.toLowerCase().trim(),
            password: hashedPassword,
            role: body.role,
            isActive: body.isActive !== undefined ? body.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('users').insertOne(user);

        return Response.json({
            message: 'User created successfully!',
            user: { ...user, _id: result.insertedId, password: undefined },
        }, { status: 201 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}