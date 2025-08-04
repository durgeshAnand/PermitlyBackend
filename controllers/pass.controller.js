<<<<<<< HEAD
import prisma from '../database/database.service.js';
import { generateQRCode } from '../utils/qr.helper.js';

export const createPass = async (req, res) => {
    try {
        const { visitor_id, expiry_time } = req.body;  //TO:DO :: khudse lenai hai

        if (!visitor_id || !expiry_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get visitor details for QR code
        const visitor = await prisma.visitor.findUnique({
            where: { visitor_id: parseInt(visitor_id) },
            select: {
                visitor_id: true,
                name: true,
                phone_number: true,
                purpose_of_visit: true
            }
        });

        if (!visitor) {
            return res.status(404).json({ error: 'Visitor not found' });
        }

        const { qr_data, hash } = await generateQRCode(visitor);
        
        const pass = await prisma.pass.create({
            data: {
                visitor_id,
                expiry_time: new Date(expiry_time),
                status: 'pending',
                qr_code_data: JSON.stringify({ qr_data, hash })
            },
            include: {
                visitor: true
            }
        });

        res.status(201).json(pass);
    } catch (error) {
        console.error('Error creating pass:', error);
        res.status(500).json({ error: 'Failed to create pass' });
    }
};

export const getAllPasses = async (req, res) => {
    try {
        const { visitor_id, status, start_date, end_date } = req.query;
        
        let where = {};
        if (visitor_id) where.visitor_id = parseInt(visitor_id);
        if (status) where.status = status;
        if (start_date || end_date) {
            where.created_at = {};
            if (start_date) where.created_at.gte = new Date(start_date);
            if (end_date) where.created_at.lte = new Date(end_date);
        }

        const passes = await prisma.pass.findMany({
            where,
            include: {
                visitor: true,
                approved_by_user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json(passes);
    } catch (error) {
        console.error('Error fetching passes:', error);
        res.status(500).json({ error: 'Failed to fetch passes' });
    }
};

export const getPassById = async (req, res) => {
    try {
        const { passId } = req.params;
        const pass = await prisma.pass.findUnique({
            where: { pass_id: parseInt(passId) },
            include: {
                visitor: true,
                approved_by_user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        res.json(pass);
    } catch (error) {
        console.error('Error fetching pass:', error);
        res.status(500).json({ error: 'Failed to fetch pass' });
    }
};

export const updatePassStatus = async (req, res) => {
    try {
        const { passId } = req.params;
        const { status } = req.body;
        const userId = req.user.user_id; // Assuming user data is added by auth middleware

        if (!['pending', 'approved', 'expired'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const pass = await prisma.pass.update({
            where: { pass_id: parseInt(passId) },
            data: {
                status,
                ...(status === 'approved' ? {
                    approved_at: new Date(),
                    approved_by: userId
                } : {})
            }
        });

        // Create notification for visitor
        await prisma.notification.create({
            data: {
                recipient_id: pass.visitor_id,
                type: 'email',
                content: `Your pass has been ${status}`,
                status: 'sent'
            }
        });

        res.json(pass);
    } catch (error) {
        console.error('Error updating pass status:', error);
        res.status(500).json({ error: 'Failed to update pass status' });
    }
};

export const recordEntry = async (req, res) => {
    try {
        const { passId } = req.params;
        const pass = await prisma.pass.findUnique({
            where: { pass_id: parseInt(passId) }
        });

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (pass.status !== 'approved') {
            return res.status(400).json({ error: 'Pass is not approved' });
        }

        if (new Date() > new Date(pass.expiry_time)) {
            return res.status(400).json({ error: 'Pass has expired' });
        }

        const updatedPass = await prisma.pass.update({
            where: { pass_id: parseInt(passId) },
            data: { entry_time: new Date() }
        });

        // Notify host
        await prisma.notification.create({
            data: {
                recipient_id: pass.visitor.host_id,
                type: 'email',
                content: `Visitor ${pass.visitor.name} has entered`,
                status: 'sent'
            }
        });

        res.json(updatedPass);
    } catch (error) {
        console.error('Error recording entry:', error);
        res.status(500).json({ error: 'Failed to record entry' });
    }
};

export const recordExit = async (req, res) => {
    try {
        const { passId } = req.params;
        const pass = await prisma.pass.findUnique({
            where: { pass_id: parseInt(passId) }
        });

        if (!pass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (!pass.entry_time) {
            return res.status(400).json({ error: 'No entry time recorded' });
        }

        const updatedPass = await prisma.pass.update({
            where: { pass_id: parseInt(passId) },
            data: { exit_time: new Date() }
        });

        // Notify host
        await prisma.notification.create({
            data: {
                recipient_id: pass.visitor.host_id,
                type: 'email',
                content: `Visitor ${pass.visitor.name} has exited`,
                status: 'sent'
            }
        });

        res.json(updatedPass);
    } catch (error) {
        console.error('Error recording exit:', error);
        res.status(500).json({ error: 'Failed to record exit' });
    }
};

export const validateQRCode = async (req, res) => {
    try {
        const { qrCode } = req.params;
        
        // Decode the base64 QR data
        const passes = await prisma.pass.findMany({
            include: {
                visitor: true
            }
        });

        // Find the pass with matching QR code data
        const pass = passes.find(p => {
            try {
                const storedQRData = JSON.parse(p.qr_code_data);
                return storedQRData.qr_data === qrCode;
            } catch (e) {
                return false;
            }
        });

        if (!pass) {
            return res.status(404).json({ error: 'Invalid QR code' });
        }

        // Decode visitor data from QR code
        const qrData = JSON.parse(Buffer.from(qrCode, 'base64').toString());
        
        // Verify if the decoded data matches the stored visitor data
        if (qrData.visitor_id !== pass.visitor.visitor_id ||
            qrData.name !== pass.visitor.name ||
            qrData.phone_number !== pass.visitor.phone_number) {
            return res.status(400).json({ error: 'QR code data mismatch' });
        }

        const isValid = pass.status === 'approved' && new Date() <= new Date(pass.expiry_time);

        res.json({
            pass_status: pass.status,
            is_valid: isValid,
            visitor: {
                name: pass.visitor.name,
                phone_number: pass.visitor.phone_number,
                email: pass.visitor.email,
                purpose_of_visit: pass.visitor.purpose_of_visit
            },
            pass_details: {
                expiry_time: pass.expiry_time,
                entry_time: pass.entry_time,
                exit_time: pass.exit_time
            }
        });
    } catch (error) {
        console.error('Error validating QR code:', error);
        res.status(500).json({ error: 'Failed to validate QR code' });
    }
};
=======
import { PassService } from '../services/pass.service.js';

const passService = new PassService();

export class PassController {
    /**
     * Create a new pass for a visitor
     */
    async createPass(req, res) {
        try {
            const pass = await passService.createPass(
                req.params.visitorId,
                req.user.user_id
            );
            res.status(201).json(pass);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Process a pass scan
     */
    // async processPassScan(req, res) {
    //     try {
    //         const result = await passService.processPassScan(
    //             req.params.passId,
    //             req.user.user_id
    //         );
    //         res.json(result);
    //     } catch (error) {
    //         res.status(400).json({ error: error.message });
    //     }
    // }

    /**
     * Get all passes with filtering
     */
    async getAllPasses(req, res) {
        try {
            const passes = await passService.getAllPasses(
                req.query,          // Query parameters (visitor_id, date_range, show_all)
                req.user.user_id,   // Current user's ID
                req.user.role       // Current user's role
            );
            
            res.json(passes);
        } catch (error) {
            console.error('Error fetching passes:', error);
            res.status(500).json({ 
                error: 'Failed to fetch passes',
                details: error.message 
            });
        }
    }
    async getPassById(req, res) {
        try {
            const { passId } = req.params;
            const pass = await passService.getPassById(
                passId,
                req.user.user_id,
                req.user.role
            );
            
            res.json(pass);
        } catch (error) {
            console.error('Error fetching pass:', error);
            if (error.message === 'Pass not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('permission')) {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to fetch pass details',
                    details: error.message 
                });
            }
        }
    }

    // async createPass(req, res) {
    //     try {
    //         const { expiry_time } = req.body;
    //         const visitor_id = req.params.visitorId; // Get visitor ID from URL params

    //         // Validate expiry time is provided
    //         if (!expiry_time) {
    //             return res.status(400).json({ 
    //                 error: 'Expiry time is required.' 
    //             });
    //         }

    //         // Validate expiry time is in the future
    //         if (new Date(expiry_time) <= new Date()) {
    //             return res.status(400).json({ 
    //                 error: 'Expiry time must be in the future' 
    //             });
    //         }

    //         const pass = await passService.createPass(visitor_id, expiry_time);
    //         res.status(201).json(pass);
    //     } catch (error) {
    //         console.error('Error creating pass:', error);
    //         res.status(500).json({ 
    //             error: 'Failed to create pass',
    //             details: error.message 
    //         });
    //     }
    // }
}
>>>>>>> origin/main
