import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET — All categories
export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const categories = await db.collection('categories')
            .find({})
            .sort({ name: 1 })
            .toArray();

        return Response.json(categories);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create category
export async function POST(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const body = await request.json();

        // Validation
        if (!body.name || body.name.trim() === '') {
            return Response.json({ error: 'Category name is required' }, { status: 400 });
        }

        // Check duplicate
        const existing = await db.collection('categories').findOne({
            name: { $regex: new RegExp(`^${body.name.trim()}$`, 'i') }
        });

        if (existing) {
            return Response.json({ error: 'Category name already exists' }, { status: 400 });
        }

        const category = {
            name: body.name.trim(),
            isActive: body.isActive !== undefined ? body.isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('categories').insertOne(category);

        return Response.json({
            message: 'Category created successfully!',
            category: { ...category, _id: result.insertedId },
        }, { status: 201 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}