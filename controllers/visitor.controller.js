import { VisitorService } from '../services/visitor.service.js';
import { validateVisitorStatus } from '../utils/validators.js';

const visitorService = new VisitorService();

export class VisitorController {
    async markVisitorExit(req, res) {
        try {
            const { visitor_id } = req.params;
            
            // Ensure the user is a guard
            if (req.user.role !== 'guard') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Only guards can mark visitor exits'
                });
            }

            const visitor = await visitorService.markVisitorExit(visitor_id);

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getActiveVisitors(req, res) {
        try {
            // Ensure the user is a guard
            if (req.user.role !== 'guard') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Only guards can view active visitors'
                });
            }

            const activeVisitors = await visitorService.getActiveVisitors();

            res.status(200).json({
                status: 'success',
                results: activeVisitors.length,
                data: {
                    visitors: activeVisitors
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async generateQRCode(req, res) {
        try {
            const { visitor_id } = req.params;
            const qrCode = await visitorService.generateVisitorQRCode(visitor_id);

            res.status(200).json({
                status: 'success',
                data: {
                    qrCode
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getAllVisitors(req, res) {
        try {
            const visitors = await visitorService.getAllVisitors(
                req.query,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async deleteVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const deletedVisitor = await visitorService.deleteVisitor(
                visitorId,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                message: 'Visitor and associated passes deleted successfully',
                data: {
                    visitor: deletedVisitor
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('permission') ? 403 
                           : error.message.includes('not found') ? 404 
                           : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getVisitorsByHostId(req, res) {
        try {
            const { host_id } = req.params;
            if (!host_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Host ID is required'
                });
            }

            const visitors = await visitorService.getVisitorsByHostId(host_id);

            res.status(200).json({
                status: 'success',
                results: visitors.length,
                data: {
                    visitors
                }
            });
        } catch (error) {
            const statusCode = error.message.includes('permission') ? 403 
                           : error.message.includes('not found') ? 404 
                           : 500;

            res.status(statusCode).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async approveVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'APPROVED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async rejectVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'REJECTED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async expireVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.updateVisitorStatus(visitorId, 'EXPIRED');

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getVisitorById(req, res) {
        try {
            const { visitorId } = req.params;
            const visitor = await visitorService.getVisitorById(
                visitorId,
                req.user.user_id,
                req.user.role
            );

            res.status(200).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(error.message.includes('permission') ? 403 : 404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async createVisitor(req, res) {
        try {
<<<<<<< HEAD
            // Check if the authenticated user is a host
            // if (req.user.role !== 'host') {
            //     return res.status(403).json({
            //         status: 'error',
            //         message: 'Only hosts can create visitors'
            //     });
            // }

=======
            // Use the authenticated user's ID as the host_id
>>>>>>> origin/main
            const visitorData = {
                name: req.body.name,
                phone_number: req.body.phone_number,
                email: req.body.email,
                purpose_of_visit: req.body.purpose_of_visit,
<<<<<<< HEAD
                host_id: req.user.user_id, // Get host_id from authenticated user
                status: 'pending'
=======
                host_id: req.user.user_id // Get host_id from authenticated user
>>>>>>> origin/main
            };

            const visitor = await visitorService.createVisitor(visitorData);

            res.status(201).json({
                status: 'success',
                data: {
                    visitor
                }
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
