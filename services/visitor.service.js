import { PrismaClient } from '@prisma/client';
import { validateEmail, validatePhoneNumber } from '../utils/validators.js';
import { generateQRCode } from '../utils/qr.helper.js';

const prisma = new PrismaClient();

export class VisitorService {
    async markVisitorExit(visitorId) {
        const visitor = await prisma.visitor.findUnique({
            where: { visitor_id: parseInt(visitorId) }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        if (visitor.status !== 'approved') {
            throw new Error('Only approved visitors can be marked as exited');
        }

        if (visitor.exit_time) {
            throw new Error('Visitor has already exited');
        }

        return await prisma.visitor.update({
            where: { visitor_id: parseInt(visitorId) },
            data: {
                status: 'exited',
                exit_time: new Date()
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            }
        });
    }

    async getActiveVisitors() {
        return await prisma.visitor.findMany({
            where: {
                status: 'approved',
                exit_time: null
            },
            orderBy: {
                created_at: 'desc'
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            }
        });
    }
    async generateVisitorQRCode(visitorId) {
        // Fetch only required visitor details
        const visitor = await prisma.visitor.findUnique({
            where: { visitor_id: parseInt(visitorId) },
            select: {
                visitor_id: true,
                name: true,
                phone_number: true,
                purpose_of_visit: true,
                status: true,
                host: {
                    select: {
                        name: true,
                        phone_number: true
                    }
                }
            }
        });

        if (!visitor) {
            throw new Error('Visitor not found');
        }

        // Generate QR code data with essential information only
        const qrCode = await generateQRCode(visitor);
        
        // Store QR code reference
        await prisma.visitor.update({
            where: { visitor_id: parseInt(visitorId) },
            data: { qr_code: qrCode }
        });

        return qrCode;
    }
    async getAllVisitors(queryParams, userId, userRole) {
        const { status, date_range, host_id } = queryParams;
        
        // Build filter conditions
        let where = {};
        
        // Filter by status if provided
        if (status) {
            where.status = status;
        }

        // Filter by date range if provided
        if (date_range) {
            const [startDate, endDate] = date_range.split(',').map(date => new Date(date));
            where.created_at = {
                gte: startDate,
                lte: endDate || new Date()
            };
        }

        // If not admin, only show visitors for the current host
        if (userRole !== 'admin') {
            where.host_id = userId;
        } 
        // If admin and specific host_id provided, filter by that host
        else if (host_id) {
            where.host_id = parseInt(host_id);
        }

        // Get visitors with their host information
        const visitors = await prisma.visitor.findMany({
            where,
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                },
                passes: {
                    select: {
                        status: true,
                        created_at: true,
                        expiry_time: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return visitors;
    }

    async createVisitor(visitorData) {
        const { name, phone_number, email, purpose_of_visit, host_id } = visitorData;

        // Validate required fields
        if (!name || !phone_number || !email || !purpose_of_visit || !host_id) {
            throw new Error('Missing required fields');
        }

        // Validate email and phone number format
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        if (!validatePhoneNumber(phone_number)) {
            throw new Error('Invalid phone number format');
        }

        // Check if host exists
        const host = await prisma.user.findUnique({
            where: { user_id: parseInt(host_id) }
        });

        if (!host) {
            throw new Error('Host not found');
        }

        // Create new visitor
        const visitor = await prisma.visitor.create({
            data: {
                name,
                phone_number,
                email,
                purpose_of_visit,
                host_id: parseInt(host_id),
                status: 'pending',
            },
            include: {
                host: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true
                    }
                }
            }
        });

        // Create notification for host
        await prisma.notification.create({
            data: {
                recipient_id: host.user_id,
                type: 'email',
                content: `New visitor request from ${name} for purpose: ${purpose_of_visit}`,
                status: 'sent'
            }
        });

        return visitor;
    }
}
