const Auction = require('../models/Auction');

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
        const { productName, description, image, category, startingPrice, durationMinutes } = req.body;

        // Validation
        if (!productName || !startingPrice) {
            return res.status(400).json({
                success: false,
                error: 'Product name and starting price are required'
            });
        }

        const endTime = new Date(Date.now() + (durationMinutes || 2) * 60 * 1000);
        
        const auction = new Auction({
            productName,
            product: {
                name: productName,
                description: description || '',
                image: image || 'https://via.placeholder.com/400x300?text=Auction+Item',
                category: category || 'General'
            },
            startingPrice,
            currentPrice: startingPrice,
            durationMinutes: durationMinutes || 2,
            endTime
        });

        await auction.save();

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
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
 * Get the first active auction
 */
const getActiveAuction = async (req, res) => {
    try {
        // Find first active auction
        const auction = await Auction.findOne({ isActive: true }).populate('participants.userId', 'username email');

        if (!auction) {
            // If no active auction found, get any auction
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
        console.error('Get active auction error:', error);
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
    getActiveAuction
};
