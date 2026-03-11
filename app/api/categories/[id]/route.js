import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// PUT — Update category
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const body = await request.json();
        const { id } = await params;

        if (!body.name || body.name.trim() === '') {
            return Response.json({ error: 'Category name is required' }, { status: 400 });
        }

        // Check duplicate (exclude current)
        const existing = await db.collection('categories').findOne({
            name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });

        if (existing) {
            return Response.json({ error: 'Category name already exists' }, { status: 400 });
        }

        await db.collection('categories').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: body.name.trim(),
                    isActive: body.isActive !== undefined ? body.isActive : true,
                    updatedAt: new Date(),
                }
            }
        );

        return Response.json({ message: 'Category updated successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Delete category
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        await db.collection('categories').deleteOne({
            _id: new ObjectId(id)
        });

        return Response.json({ message: 'Category deleted successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}