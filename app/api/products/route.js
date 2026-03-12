import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET — All products
export async function GET() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const products = await db.collection('products')
            .find({})
            .sort({ name: 1 })
            .toArray();

        const categoryIds = products.filter(p => p.categoryId).map(p => p.categoryId);
        const categories = await db.collection('categories')
            .find({ _id: { $in: categoryIds } })
            .toArray();

        const categoryMap = {};
        categories.forEach(cat => { categoryMap[cat._id.toString()] = cat; });

        const productsWithCategory = products.map(product => ({
            ...product,
            category: product.categoryId ? categoryMap[product.categoryId.toString()] || null : null,
        }));

        return Response.json(productsWithCategory);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// POST — Create product with image upload
export async function POST(request) {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const formData = await request.formData();
        const name = formData.get('name');
        const categoryId = formData.get('categoryId');
        const isActive = formData.get('isActive') === 'true';
        const options = JSON.parse(formData.get('options') || '[]');
        const imageFile = formData.get('image');

        if (!name || name.trim() === '') return Response.json({ error: 'Product name is required' }, { status: 400 });
        if (!categoryId) return Response.json({ error: 'Category is required' }, { status: 400 });
        if (options.length === 0) return Response.json({ error: 'At least one option is required' }, { status: 400 });

        // Check duplicate
        const existing = await db.collection('products').findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });
        if (existing) return Response.json({ error: 'Product name already exists' }, { status: 400 });

        // Handle image upload
        let imagePath = null;
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
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }

        const product = {
            categoryId: new ObjectId(categoryId),
            name: name.trim(),
            image: imagePath,
            options: options.map(opt => ({
                _id: new ObjectId(),
                name: opt.name,
                price: parseFloat(opt.price),
                isActive: opt.isActive !== false,
            })),
            isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('products').insertOne(product);

        return Response.json({
            message: 'Product created successfully!',
            product: { ...product, _id: result.insertedId },
        }, { status: 201 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}