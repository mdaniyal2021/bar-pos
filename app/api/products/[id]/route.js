import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET — Single product
export async function GET(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
        if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });

        return Response.json(product);
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update product with image upload
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
        const imageFile = formData.get('image');

        if (!name || name.trim() === '') return Response.json({ error: 'Product name is required' }, { status: 400 });
        if (options.length === 0) return Response.json({ error: 'At least one option is required' }, { status: 400 });

        // Check duplicate
        const duplicate = await db.collection('products').findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (duplicate) return Response.json({ error: 'Product name already exists' }, { status: 400 });

        // Handle new image upload
        let imagePath = existingImage || null;
        if (imageFile && imageFile.size > 0) {
            try {
                const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
                if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

                const bytes = await imageFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const ext = imageFile.name.split('.').pop().toLowerCase();
                const filename = `${Date.now()}-${name.trim().replace(/\s+/g, '-').toLowerCase()}.${ext}`;

                await writeFile(join(uploadDir, filename), buffer);
                imagePath = `/uploads/products/${filename}`;

                // Delete old image file if exists
                if (existingImage && existingImage.startsWith('/uploads/')) {
                    try {
                        const oldPath = join(process.cwd(), 'public', existingImage);
                        if (existsSync(oldPath)) await unlink(oldPath);
                    } catch {}
                }
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }

        await db.collection('products').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    categoryId: new ObjectId(categoryId),
                    name: name.trim(),
                    image: imagePath,
                    options: options.map(opt => ({
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

        // Get product to delete its image
        const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
        if (product?.image && product.image.startsWith('/uploads/')) {
            try {
                const imgPath = join(process.cwd(), 'public', product.image);
                if (existsSync(imgPath)) await unlink(imgPath);
            } catch {}
        }

        await db.collection('products').deleteOne({ _id: new ObjectId(id) });

        return Response.json({ message: 'Product deleted successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}