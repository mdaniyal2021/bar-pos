import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import cloudinary from '@/lib/cloudinary';

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

// PUT — Update product with Cloudinary image upload
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

        // Stock fields
        const stockEnabled = formData.get('stockEnabled') === 'true';
        const stockQuantity = parseInt(formData.get('stockQuantity')) || 0;

        if (!name || name.trim() === '') return Response.json({ error: 'Product name is required' }, { status: 400 });
        if (options.length === 0) return Response.json({ error: 'At least one option is required' }, { status: 400 });

        // Check duplicate
        const duplicate = await db.collection('products').findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (duplicate) return Response.json({ error: 'Product name already exists' }, { status: 400 });

        // Upload new image to Cloudinary
        let imagePath = existingImage || null;
        if (imageFile && imageFile.size > 0) {
            try {
                const bytes = await imageFile.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const result = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'bar-pos/products',
                            public_id: `${Date.now()}-${name.trim().replace(/\s+/g, '-').toLowerCase()}`,
                            transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    ).end(buffer);
                });

                imagePath = result.secure_url;

                // Delete old image from Cloudinary
                if (existingImage && existingImage.includes('cloudinary.com')) {
                    try {
                        const publicId = existingImage.split('/').slice(-1)[0].split('.')[0];
                        await cloudinary.uploader.destroy(`bar-pos/products/${publicId}`);
                    } catch {}
                }

            } catch (err) {
                console.error('Cloudinary upload failed:', err);
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
                    stockEnabled,
                    stockQuantity: stockEnabled ? stockQuantity : 0,
                    updatedAt: new Date(),
                }
            }
        );

        return Response.json({ message: 'Product updated successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — Delete product + Cloudinary image
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const db = mongoose.connection.db;
        const { id } = await params;

        const product = await db.collection('products').findOne({ _id: new ObjectId(id) });

        // Delete image from Cloudinary
        if (product?.image && product.image.includes('cloudinary.com')) {
            try {
                const publicId = product.image.split('/').slice(-1)[0].split('.')[0];
                await cloudinary.uploader.destroy(`bar-pos/products/${publicId}`);
            } catch {}
        }

        await db.collection('products').deleteOne({ _id: new ObjectId(id) });

        return Response.json({ message: 'Product deleted successfully!' });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}