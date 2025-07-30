import express from 'express';
import {
    createPass,
    getAllPasses,
    getPassById,
    updatePassStatus,
    recordEntry,
    recordExit,
    validateQRCode
} from '../controllers/pass.controller.js';

const router = express.Router();

// Pass Routes
router.post('/', createPass);
router.get('/', getAllPasses);
router.get('/:passId', getPassById);
router.put('/:passId/status', updatePassStatus);
router.put('/:passId/entry', recordEntry);
router.put('/:passId/exit', recordExit);
router.get('/qr/:qrCode', validateQRCode);

export default router;
