import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                await connectDB();

                const db = mongoose.connection.db;
                const user = await db.collection('users').findOne({
                    email: credentials.email.toLowerCase()
                });

                if (!user) throw new Error('Invalid email or password');
                if (!user.isActive) throw new Error('Account is inactive. Contact admin.');

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) throw new Error('Invalid email or password');

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.role = token.role;
            session.user.id = token.id;
            return session;
        },
    },
    pages: { signIn: '/login', error: '/login' },
    session: {
        strategy: 'jwt',
        maxAge: 8 * 60 * 60, // 8 hours — session expire
    },
    jwt: {
        maxAge: 8 * 60 * 60, // JWT bhi 8 hours
    },
});

export { handler as GET, handler as POST };