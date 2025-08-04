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
<<<<<<< HEAD

/**
 * Guard-specific Routes
 * These routes are only accessible by users with the 'guard' role
 * Used for managing visitor entry/exit and monitoring active visitors
 */
router.get('/active', restrictTo('guard'), visitorController.getActiveVisitors);         // Get list of all currently active visitors
router.post('/:visitor_id/exit', restrictTo('guard'), visitorController.markVisitorExit); // Mark visitor as exited, records exit time

/**
 * Host and Admin Authorization
 * All routes below this middleware require 'host' or 'admin' role
 */
router.use('/:id', restrictTo('admin', 'host'));
=======
// Only hosts and admins can manage visitors
router.use('/:visitorId', restrictTo('admin', 'host'));
>>>>>>> origin/main

/**
 * Visitor Management Routes
 * Core functionality for managing visitors in the system
 */
// Create new visitor request - Used by hosts to register new visitors
router.post('/', visitorController.createVisitor);

<<<<<<< HEAD
// Get all visitors with filters - Used by hosts to view their visitors, admins to view all
router.get('/', visitorController.getAllVisitors);

// Get detailed information about a specific visitor
router.get('/:visitorId', (req, res) => {
    // TODO: Get visitor details
    // Returns: Visitor's complete profile including:
    // - Personal information
    // - Host details
    // - Associated passes
    // - Visit history
});

/**
 * Visitor Status Management
 * Used by hosts/admin to manage visitor approval workflow
 */
router.put('/:visitorId/status', (req, res) => {
    // TODO: Update visitor status
    // Status options: 'pending', 'approved', 'rejected'
    // Automatically:
    // - Updates timestamp
    // - Triggers notifications
    // - Appears in guard interface if approved
});

/**
 * Host-specific Visitor Management
 * Used for viewing and managing visitors for a specific host
 */
router.get('/host/:hostId', (req, res) => {
    // TODO: Get host's visitors
    // Features:
    // - Filter by status (pending/approved/rejected/exited)
    // - Filter by date range
    // - Includes pass information
    // - Sort by creation/update time
});

/**
 * Administrative Actions
 * Used for removing visitor records from the system
 */
router.delete('/:visitorId', (req, res) => {
    // TODO: Remove visitor record
    // Actions performed:
    // - Cancels any active passes
    // - Sends notifications to relevant parties
    // - Removes associated records
});
=======
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
>>>>>>> origin/main

export default router;
