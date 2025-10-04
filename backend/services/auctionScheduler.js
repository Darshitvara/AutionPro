const Auction = require('../models/Auction');

class AuctionScheduler {
    constructor() {
        this.scheduledAuctions = new Map(); // Map of auction ID to timeout ID
        this.isInitialized = false;
    }

    /**
     * Initialize the scheduler and check for existing scheduled auctions
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('Initializing auction scheduler...');
        
        try {
            // Find all upcoming auctions
            const upcomingAuctions = await Auction.find({ status: 'upcoming' });
            
            for (const auction of upcomingAuctions) {
                this.scheduleAuction(auction);
            }
            
            this.isInitialized = true;
            console.log(`Auction scheduler initialized with ${upcomingAuctions.length} upcoming auctions`);
        } catch (error) {
            console.error('Failed to initialize auction scheduler:', error);
        }
    }

    /**
     * Schedule an auction to start automatically
     */
    scheduleAuction(auction) {
        if (!auction.scheduledStartTime || auction.status !== 'upcoming') {
            return;
        }

        const now = new Date();
        const startTime = new Date(auction.scheduledStartTime);
        const delay = startTime.getTime() - now.getTime();

        // If the start time has already passed, start immediately
        if (delay <= 0) {
            console.log(`Starting auction ${auction._id} immediately (scheduled time has passed)`);
            this.startAuction(auction._id);
            return;
        }

        // Schedule the auction to start
        const timeoutId = setTimeout(() => {
            this.startAuction(auction._id);
        }, delay);

        this.scheduledAuctions.set(auction._id.toString(), timeoutId);
        
        console.log(`Scheduled auction ${auction._id} to start in ${Math.round(delay / 1000)} seconds`);
    }

    /**
     * Start an auction and schedule it to end after the duration
     */
    async startAuction(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            if (!auction || auction.status !== 'upcoming') {
                console.log(`Auction ${auctionId} not found or not upcoming`);
                return;
            }

            // Start the auction
            await auction.startAuction();
            console.log(`Auction ${auctionId} started automatically`);

            // Remove from scheduled auctions
            this.cancelScheduledAuction(auctionId);

            // Schedule the auction to end after the duration
            const endDelay = auction.durationMinutes * 60 * 1000; // Convert to milliseconds
            const endTimeoutId = setTimeout(() => {
                this.endAuction(auctionId);
            }, endDelay);

            this.scheduledAuctions.set(auctionId.toString() + '_end', endTimeoutId);
            
            console.log(`Scheduled auction ${auctionId} to end in ${auction.durationMinutes} minutes`);

            // Emit socket event for real-time updates
            if (global.io) {
                global.io.emit('auctionStarted', {
                    auctionId: auction._id,
                    auction: auction.getState()
                });
            }

        } catch (error) {
            console.error(`Failed to start auction ${auctionId}:`, error);
        }
    }

    /**
     * End an auction automatically
     */
    async endAuction(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            if (!auction || auction.status !== 'live') {
                console.log(`Auction ${auctionId} not found or not live`);
                return;
            }

            // End the auction
            await auction.endAuction();
            console.log(`Auction ${auctionId} ended automatically`);

            // Remove from scheduled auctions
            this.cancelScheduledAuction(auctionId + '_end');

            // Emit socket event for real-time updates
            if (global.io) {
                global.io.emit('auctionEnded', {
                    auctionId: auction._id,
                    auction: auction.getState()
                });
            }

        } catch (error) {
            console.error(`Failed to end auction ${auctionId}:`, error);
        }
    }

    /**
     * Cancel a scheduled auction
     */
    cancelScheduledAuction(auctionId) {
        const timeoutId = this.scheduledAuctions.get(auctionId.toString());
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.scheduledAuctions.delete(auctionId.toString());
            console.log(`Cancelled scheduled auction ${auctionId}`);
        }
    }

    /**
     * Add a new auction to the scheduler
     */
    addAuction(auction) {
        this.scheduleAuction(auction);
    }

    /**
     * Remove an auction from the scheduler (when manually started/stopped)
     */
    removeAuction(auctionId) {
        this.cancelScheduledAuction(auctionId);
        this.cancelScheduledAuction(auctionId + '_end');
    }

    /**
     * Get status of scheduled auctions
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            scheduledCount: this.scheduledAuctions.size
        };
    }
}

// Create singleton instance
const auctionScheduler = new AuctionScheduler();

module.exports = auctionScheduler;