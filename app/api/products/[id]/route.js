import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// GET — Single product
export async function GET(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        const product = await db.collection('products').findOne({
            _id: new ObjectId(id)
        });

        if (!product) {
            return Response.json({ error: 'Product not found' }, { status: 404 });
        }

        return Response.json(product);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update product
export async function PUT(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        const formData = await request.formData();
        const name = formData.get('name');
        const categoryId = formData.get('categoryId');
        const isActive = formData.get('isActive') === 'true';
        const options = JSON.parse(formData.get('options') || '[]');
        const existingImage = formData.get('existingImage');

        // Validation
        if (!name || name.trim() === '') {
            return Response.json({ error: 'Product name is required' }, { status: 400 });
        }
        if (options.length === 0) {
            return Response.json({ error: 'At least one option is required' }, { status: 400 });
        }

        // Check duplicate
        const existing = await db.collection('products').findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (existing) {
            return Response.json({ error: 'Product name already exists' }, { status: 400 });
        }

        await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    categoryId: new ObjectId(categoryId),
                    name: name.trim(),
                    image: existingImage || null, // Keep existing, no new upload
                    options: options.map((opt) => ({
                        _id: opt._id ? new ObjectId(opt._id) : new ObjectId(),
                        name: opt.name,
                        price: parseFloat(opt.price),
                        isActive: opt.isActive !== false,
                    })),
                    isActive,
                    updatedAt: new Date(),
                }
            }
        );

        return Response.json({ message: 'Product updated successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Delete product
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        await db.collection('products').deleteOne({
            _id: new ObjectId(id)
        });

        return Response.json({ message: 'Product deleted successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}