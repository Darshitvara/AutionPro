const Auction = require('../models/Auction');
const auctionScheduler = require('../services/auctionScheduler');

/**
 * Get all auctions
 */
const getAllAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find({}).populate('participants.userId', 'username email');
        const auctionStates = auctions.map(auction => auction.getState());
        
        res.json({
            success: true,
            count: auctionStates.length,
            auctions: auctionStates
        });
    } catch (error) {
        console.error('Get auctions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Get auction by ID
 */
const getAuctionById = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findById(id).populate('participants.userId', 'username email');

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        res.json({
            success: true,
            auction: auction.getState()
        });
    } catch (error) {
        console.error('Get auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Create new auction (admin only)
 */
const createAuction = async (req, res) => {
    try {
        const { productName, product, startingPrice, durationMinutes, scheduledStartTime } = req.body;

        // Validation
        if (!productName || !startingPrice) {
            return res.status(400).json({
                success: false,
                error: 'Product name and starting price are required'
            });
        }

        // For new auctions, scheduledStartTime is required
        if (!scheduledStartTime) {
            return res.status(400).json({
                success: false,
                error: 'Scheduled start time is required for new auctions'
            });
        }

        // Validate scheduled start time is in the future
        const startTime = new Date(scheduledStartTime);
        if (startTime <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Scheduled start time must be in the future'
            });
        }

        // Create auction with upcoming status (automatically tagged)
        const auction = new Auction({
            productName,
            product: {
                name: product?.name || productName,
                description: product?.description || 'Premium auction item with excellent quality.',
                image: product?.image || 'https://via.placeholder.com/400x300?text=Auction+Item',
                category: product?.category || 'General'
            },
            startingPrice,
            currentPrice: startingPrice,
            durationMinutes: durationMinutes || 5, // Default to 5 minutes
            scheduledStartTime: startTime,
            status: 'upcoming' // Automatically tagged as upcoming
        });

        await auction.save();

        // Add to scheduler
        auctionScheduler.addAuction(auction);

        res.status(201).json({
            success: true,
            message: 'Upcoming auction created successfully',
            auction: auction.getState()
        });
    } catch (error) {
        console.error('Create auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Delete auction (admin only)
 */
const deleteAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findByIdAndDelete(id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        res.json({
            success: true,
            message: 'Auction deleted successfully'
        });
    } catch (error) {
        console.error('Delete auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Get the first live auction
 */
const getLiveAuction = async (req, res) => {
    try {
        // Find first live auction
        const auction = await Auction.findOne({ status: 'live' }).populate('participants.userId', 'username email');

        if (!auction) {
            // If no live auction found, get any auction
            const anyAuction = await Auction.findOne({}).populate('participants.userId', 'username email');
            
            if (!anyAuction) {
                return res.status(404).json({
                    success: false,
                    error: 'No auctions available'
                });
            }

            return res.json({
                success: true,
                auction: anyAuction.getState()
            });
        }

        res.json({
            success: true,
            auction: auction.getState()
        });
    } catch (error) {
        console.error('Get live auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Manually start a scheduled auction (admin only)
 */
const startAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findById(id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        if (auction.status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                error: 'Only upcoming auctions can be started manually'
            });
        }

        await auction.startAuction();

        // Remove from scheduler and schedule end time
        auctionScheduler.removeAuction(auction._id);
        
        // Schedule the auction to end after the duration
        const endDelay = auction.durationMinutes * 60 * 1000;
        setTimeout(() => {
            auctionScheduler.endAuction(auction._id);
        }, endDelay);

        // Emit socket event
        if (global.io) {
            global.io.emit('auctionStarted', {
                auctionId: auction._id,
                auction: auction.getState()
            });
        }

        res.json({
            success: true,
            message: 'Auction started successfully',
            auction: auction.getState()
        });
    } catch (error) {
        console.error('Start auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

/**
 * Manually stop an active auction (admin only)
 */
const stopAuction = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findById(id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        if (auction.status !== 'live') {
            return res.status(400).json({
                success: false,
                error: 'Only live auctions can be stopped'
            });
        }

        await auction.endAuction();

        // Remove from scheduler
        auctionScheduler.removeAuction(auction._id);

        // Emit socket event
        if (global.io) {
            global.io.emit('auctionEnded', {
                auctionId: auction._id,
                auction: auction.getState()
            });
        }

        res.json({
            success: true,
            message: 'Auction stopped successfully',
            auction: auction.getState()
        });
    } catch (error) {
        console.error('Stop auction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

module.exports = {
    getAllAuctions,
    getAuctionById,
    createAuction,
    deleteAuction,
    getLiveAuction,
    startAuction,
    stopAuction
};
