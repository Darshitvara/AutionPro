const express = require('express');
const router = express.Router();
const {
    getAllAuctions,
    getAuctionById,
    createAuction,
    deleteAuction,
    getLiveAuction,
    startAuction,
    stopAuction
} = require('../controllers/auctionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Public routes (require authentication)
router.get('/', authMiddleware, getAllAuctions);
router.get('/live', authMiddleware, getLiveAuction);
router.get('/:id', authMiddleware, getAuctionById);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, createAuction);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAuction);
router.put('/:id/start', authMiddleware, adminMiddleware, startAuction);
router.put('/:id/stop', authMiddleware, adminMiddleware, stopAuction);

module.exports = router;
