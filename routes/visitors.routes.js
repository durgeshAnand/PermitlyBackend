import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { VisitorController } from '../controllers/visitor.controller.js';

const router = express.Router();
const visitorController = new VisitorController();

/**
 * Authentication Middleware
 * All routes below this middleware require authentication
 */
router.use(protect);
// Only hosts and admins can manage visitors
router.use('/:visitorId', restrictTo('admin', 'host'));

/**
 * Visitor Management Routes
 * Core functionality for managing visitors in the system
 */
// Create new visitor request - Used by hosts to register new visitors
router.post('/', visitorController.createVisitor);

//only visitor information
//in user showall false
// admin has to button one to show all visitors and one for his own showall false.
router.get('/', visitorController.getAllVisitors); // toggle for admin to view all visitors  and his own & for host to view their own visitors.

// how the url look like : /visitors/1      
// Get visitor details by ID
router.get('/:visitorId', visitorController.getVisitorById); // // Only admin or the host of this visitor can view details


// Simple approve/reject/expire routes without verification
router.put('/:visitorId/approve', visitorController.approveVisitor);
router.put('/:visitorId/reject', visitorController.rejectVisitor);
router.put('/:visitorId/expire', visitorController.expireVisitor);

// Get visitors by host ID // no permission check needed
router.get('/host/:host_id', visitorController.getVisitorsByHostId); // Simple route to get visitors for a specific host(admin only)


// deletes visitor and pass
router.delete('/:visitorId', visitorController.deleteVisitor); // both admin and host can delete a visitor and notify to host and visitor also use transaction handling for data consistency.

export default router;
