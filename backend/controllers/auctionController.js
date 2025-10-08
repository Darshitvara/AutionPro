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

        // Start the auction and update database
        console.log(`Starting auction ${auction._id} (${auction.productName})`);
        const startResult = await auction.startAuction();
        if (!startResult.success) {
            console.error(`Failed to start auction ${auction._id}:`, startResult.message);
            return res.status(400).json({
                success: false,
                error: startResult.message || 'Failed to start auction'
            });
        }
        console.log(`Auction ${auction._id} started successfully. Status: ${auction.status}, StartTime: ${auction.actualStartTime}, EndTime: ${auction.endTime}`);

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
        console.log(`[CONTROLLER] Stop auction request for ID: ${id} by admin: ${req.user.id}`);
        
        const auction = await Auction.findById(id);

        if (!auction) {
            console.log(`[CONTROLLER] Auction ${id} not found`);
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        console.log(`[CONTROLLER] Found auction: ${auction.productName}, current status: ${auction.status}`);

        if (auction.status !== 'live') {
            console.log(`[CONTROLLER] Cannot stop auction ${id} - status is ${auction.status}, expected 'live'`);
            return res.status(400).json({
                success: false,
                error: 'Only live auctions can be stopped'
            });
        }

        // End the auction and update database
        console.log(`[CONTROLLER] Calling endAuction method for ${auction._id}`);
        const endResult = await auction.endAuction(req.user.id, true);
        
        if (!endResult.success) {
            console.error(`[CONTROLLER] Failed to stop auction ${auction._id}:`, endResult.message);
            return res.status(400).json({
                success: false,
                error: endResult.message || 'Failed to stop auction'
            });
        }
        
        console.log(`[CONTROLLER] endAuction method returned success, checking database...`);
        
        // Double-check that the auction was actually updated in the database
        const updatedAuction = await Auction.findById(auction._id);
        console.log(`[CONTROLLER] Database check - auction status: ${updatedAuction.status}`);
        
        if (updatedAuction.status !== 'closed') {
            console.error(`[CONTROLLER] Database verification failed - auction ${auction._id} status is ${updatedAuction.status}, expected 'closed'`);
            return res.status(500).json({
                success: false,
                error: 'Database update verification failed'
            });
        }
        
        console.log(`[CONTROLLER] Auction ${auction._id} stopped successfully. Status: ${updatedAuction.status}, Winner: ${updatedAuction.winnerUsername}, Final Price: ${updatedAuction.finalPrice}`);

        // Remove from scheduler
        auctionScheduler.removeAuction(auction._id);

        // Emit socket event
        if (global.io) {
            global.io.emit('auctionEnded', {
                auctionId: updatedAuction._id,
                auction: updatedAuction.getState()
            });
        }

        res.json({
            success: true,
            message: 'Auction stopped successfully and changes saved to database',
            auction: updatedAuction.getState(),
            verification: {
                status: updatedAuction.status,
                manuallyEnded: updatedAuction.manuallyEnded,
                endedBy: updatedAuction.endedBy,
                actualEndTime: updatedAuction.actualEndTime,
                winner: updatedAuction.winnerUsername,
                finalPrice: updatedAuction.finalPrice
            }
        });
    } catch (error) {
        console.error('[CONTROLLER] Stop auction error:', error);
        console.error('[CONTROLLER] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
};

/**
 * Verify auction status in database (for debugging/testing)
 */
const verifyAuctionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const auction = await Auction.findById(id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                error: 'Auction not found'
            });
        }

        res.json({
            success: true,
            auction: {
                id: auction._id,
                productName: auction.productName,
                status: auction.status,
                isActive: auction.isActive,
                actualStartTime: auction.actualStartTime,
                endTime: auction.endTime,
                actualEndTime: auction.actualEndTime,
                manuallyEnded: auction.manuallyEnded,
                endedBy: auction.endedBy,
                winnerId: auction.winnerId,
                winnerUsername: auction.winnerUsername,
                finalPrice: auction.finalPrice,
                currentPrice: auction.currentPrice,
                highestBidder: auction.highestBidder,
                lastModified: auction.updatedAt
            }
        });
    } catch (error) {
        console.error('Verify auction status error:', error);
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
    stopAuction,
    verifyAuctionStatus
};
