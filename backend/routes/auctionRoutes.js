const express = require('express');
const router = express.Router();
const {
    getAllAuctions,
    getAuctionById,
    createAuction,
    deleteAuction
} = require('../controllers/auctionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Public routes (require authentication)
router.get('/', authMiddleware, getAllAuctions);
router.get('/:id', authMiddleware, getAuctionById);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, createAuction);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAuction);

module.exports = router;
