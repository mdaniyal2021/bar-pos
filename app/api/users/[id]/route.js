import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// PUT — Update user
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;
        const body = await request.json();

        // Validation
        if (!body.name?.trim()) {
            return Response.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!body.email?.trim()) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }
        if (body.password && body.password.length < 6) {
            return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check duplicate email
        const existing = await db.collection('users').findOne({
            email: body.email.toLowerCase().trim(),
            _id: { $ne: new ObjectId(id) }
        });
        if (existing) {
            return Response.json({ error: 'Email already exists' }, { status: 400 });
        }

        const updateData = {
            name: body.name.trim(),
            email: body.email.toLowerCase().trim(),
            role: body.role,
            isActive: body.isActive,
            updatedAt: new Date(),
        };

        // Only update password if provided
        if (body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(body.password, salt);
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return Response.json({ message: 'User updated successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Delete user
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        await db.collection('users').deleteOne({
            _id: new ObjectId(id)
        });

        return Response.json({ message: 'User deleted successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}