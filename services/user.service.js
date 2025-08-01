import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import AppError from '../middleware/error.middleware.js';

const prisma = new PrismaClient();

class UserService {
    /**
     * Get user profile with related counts
     */
    async getUserProfile(userId) {
        const user = await prisma.User.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                phone_number: true,
                created_at: true,
                _count: {
                    select: {
                        // Count of visitors they've hosted (based on our schema relation name)
                        visitors: true,
                        // Count of passes they've verified
                        passes: true
                    }
                }
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updateData) {
        const user = await prisma.User.findUnique({
            where: { user_id: userId }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Create a clean update object
        const updateFields = {};

        // Handle password and email verification first
        if (updateData.new_password || (updateData.email && updateData.email !== user.email)) {
            if (!updateData.current_password) {
                throw new AppError('Current password is required to update password or email', 400);
            }

            const isValidPassword = await bcrypt.compare(
                updateData.current_password,
                user.password_hash
            );

            if (!isValidPassword) {
                throw new AppError('Current password is incorrect', 401);
            }
        }

        // If trying to update email, verify current password
        if (updateData.email && updateData.email !== user.email) {
            if (!updateData.current_password) {
                throw new AppError('Current password is required to update email', 400);
            }

            const isValidPassword = await bcrypt.compare(
                updateData.current_password,
                user.password_hash
            );

            if (!isValidPassword) {
                throw new AppError('Current password is incorrect', 401);
            }

            // Check if new email is already in use
            const emailExists = await prisma.User.findUnique({
                where: { email: updateData.email }
            });

            if (emailExists) {
                throw new AppError('Email already in use', 400);
            }
        }

        // Remove current_password from update data
        delete updateData.current_password;

        // Add allowed fields to update object
        if (updateData.name) updateFields.name = updateData.name;
        if (updateData.phone_number) updateFields.phone_number = updateData.phone_number;
        if (updateData.role) updateFields.role = updateData.role;
        
        // Handle email update
        if (updateData.email && updateData.email !== user.email) {
            // Check if new email is already in use
            const emailExists = await prisma.User.findUnique({
                where: { email: updateData.email }
            });

            if (emailExists) {
                throw new AppError('Email already in use', 400);
            }
            updateFields.email = updateData.email;
        }

        // Handle password update
        if (updateData.new_password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password_hash = await bcrypt.hash(updateData.new_password, salt);
        }

        // Update user
        const updatedUser = await prisma.User.update({
            where: { user_id: userId },
            data: {
                ...updateFields,
                updated_at: new Date()
            },
            select: {
                user_id: true,
                name: true,
                email: true,
                role: true,
                phone_number: true,
                created_at: true,
                updated_at: true
            }
        });

        return updatedUser;
    }

    /**
     * Get recent visitors for a host
     */
    async getRecentVisitors(hostId, limit = 10) {
        const recentVisitors = await prisma.Visitor.findMany({
            where: { host_id: hostId },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                pass: true
            }
        });

        return recentVisitors;
    }
}

export default new UserService();
