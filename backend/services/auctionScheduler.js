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
            // Find all upcoming and scheduled auctions
            const upcomingAuctions = await Auction.find({ 
                status: { $in: ['upcoming', 'scheduled'] } 
            });
            
            console.log(`Found ${upcomingAuctions.length} auctions to schedule:`, 
                upcomingAuctions.map(a => ({ id: a._id, status: a.status, scheduledTime: a.scheduledStartTime })));
            
            for (const auction of upcomingAuctions) {
                this.scheduleAuction(auction);
            }
            
            this.isInitialized = true;
            console.log(`Auction scheduler initialized with ${upcomingAuctions.length} upcoming/scheduled auctions`);
        } catch (error) {
            console.error('Failed to initialize auction scheduler:', error);
        }
    }

    /**
     * Schedule an auction to become ready for manual start (no auto-start)
     */
    scheduleAuction(auction) {
        if (!auction.scheduledStartTime || !['upcoming', 'scheduled'].includes(auction.status)) {
            console.log(`Skipping auction ${auction._id} - missing scheduledStartTime or invalid status (${auction.status})`);
            return;
        }

        const now = new Date();
        const startTime = new Date(auction.scheduledStartTime);
        const delay = startTime.getTime() - now.getTime();

        console.log(`Processing auction ${auction._id} with status: ${auction.status}, scheduled for: ${startTime.toISOString()}`);

        // If the start time has already passed, just mark as ready for manual start
        if (delay <= 0) {
            console.log(`Auction ${auction._id} is now ready for manual start (scheduled time has passed)`);
            this.markAsReadyForStart(auction._id);
            return;
        }

        // Schedule the auction to become ready for manual start (not auto-start)
        const timeoutId = setTimeout(() => {
            this.markAsReadyForStart(auction._id);
        }, delay);

        this.scheduledAuctions.set(auction._id.toString(), timeoutId);
        
        console.log(`Scheduled auction ${auction._id} to become ready for manual start in ${Math.round(delay / 1000)} seconds`);
        
        // Also schedule expiration check after 7 days from scheduled start time
        const expirationDelay = delay + (7 * 24 * 60 * 60 * 1000); // 7 days after scheduled start
        const expirationTimeoutId = setTimeout(() => {
            this.expireAuction(auction._id);
        }, expirationDelay);
        
        this.scheduledAuctions.set(auction._id.toString() + '_expire', expirationTimeoutId);
        console.log(`Scheduled auction ${auction._id} to expire in ${Math.round(expirationDelay / (1000 * 60 * 60 * 24))} days if not started`);
    }

    /**
     * Mark auction as ready for manual start (doesn't actually start it)
     */
    async markAsReadyForStart(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            if (!auction || !['upcoming', 'scheduled'].includes(auction.status)) {
                console.log(`Auction ${auctionId} not found or not upcoming/scheduled (current status: ${auction?.status})`);
                return;
            }

            console.log(`Auction ${auctionId} is now ready for manual start (current status: ${auction.status})`);
            
            // Emit socket event to notify frontend that auction is ready for manual start
            if (global.io) {
                global.io.emit('auctionReadyForStart', {
                    auctionId: auction._id,
                    message: 'Auction is now ready for manual start'
                });
            }

            // Remove the start timeout (but keep the expiration timeout)
            this.cancelScheduledAuction(auctionId);
            
        } catch (error) {
            console.error(`Failed to mark auction ${auctionId} as ready for start:`, error);
        }
    }

    /**
     * Expire an auction that wasn't started within 7 days
     */
    async expireAuction(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            if (!auction || !['upcoming', 'scheduled'].includes(auction.status)) {
                console.log(`Auction ${auctionId} not found or not upcoming/scheduled (may have been started or ended). Current status: ${auction?.status}`);
                return;
            }

            // Mark auction as expired
            auction.status = 'ended';
            auction.expiredReason = 'Not started within 7 days of scheduled time';
            auction.endTime = new Date();
            
            await auction.save();
            
            console.log(`Auction ${auctionId} expired - not started within 7 days`);
            
            // Emit socket event for real-time updates
            if (global.io) {
                global.io.emit('auctionExpired', {
                    auctionId: auction._id,
                    reason: 'Not started within 7 days'
                });
            }

            // Clean up any remaining timeouts
            this.cancelScheduledAuction(auctionId);
            this.cancelScheduledAuction(auctionId + '_expire');
            
        } catch (error) {
            console.error(`Failed to expire auction ${auctionId}:`, error);
        }
    }

    /**
     * Manually start an auction (called by admin action)
     */
    async startAuction(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            
            console.log(`[SCHEDULER] Attempting to start auction ${auctionId}`);
            console.log(`[SCHEDULER] Auction found:`, auction ? 'Yes' : 'No');
            
            if (!auction) {
                console.log(`[SCHEDULER] Auction ${auctionId} not found in database`);
                return { success: false, message: 'Auction not found' };
            }
            
            console.log(`[SCHEDULER] Auction ${auctionId} current status: ${auction.status}`);
            console.log(`[SCHEDULER] Auction ${auctionId} scheduled start time: ${auction.scheduledStartTime}`);
            
            // Accept both 'upcoming' and 'scheduled' status (to handle migration cases)
            const validStatuses = ['upcoming', 'scheduled'];
            if (!validStatuses.includes(auction.status)) {
                console.log(`[SCHEDULER] Auction ${auctionId} cannot be started - status is '${auction.status}', expected one of: ${validStatuses.join(', ')}`);
                return { success: false, message: `Only upcoming/scheduled auctions can be started manually. Current status: ${auction.status}` };
            }

            // Check if auction scheduled time has passed (required for manual start)
            const now = new Date();
            const startTime = new Date(auction.scheduledStartTime);
            console.log(`[SCHEDULER] Current time: ${now.toISOString()}`);
            console.log(`[SCHEDULER] Scheduled time: ${startTime.toISOString()}`);
            
            if (now < startTime) {
                console.log(`[SCHEDULER] Auction ${auctionId} cannot be started yet - scheduled time not reached`);
                return { success: false, message: 'Auction scheduled time has not yet arrived' };
            }

            // Check if auction hasn't expired (7 days past scheduled time)
            const sevenDaysAfterScheduled = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (now > sevenDaysAfterScheduled) {
                console.log(`[SCHEDULER] Auction ${auctionId} has expired - more than 7 days past scheduled time`);
                // Auto-expire the auction
                await this.expireAuction(auctionId);
                return { success: false, message: 'Auction has expired (not started within 7 days)' };
            }

            console.log(`[SCHEDULER] All validations passed, attempting to start auction ${auctionId}`);
            
            // Start the auction
            const startResult = await auction.startAuction();
            if (startResult.success) {
                console.log(`[SCHEDULER] Auction ${auctionId} started manually by admin`);
            } else {
                console.log(`[SCHEDULER] Failed to start auction ${auctionId}:`, startResult.message);
                return startResult;
            }

            // Remove from scheduled auctions (cancel expiration timeout)
            this.cancelScheduledAuction(auctionId);
            this.cancelScheduledAuction(auctionId + '_expire');

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

            return { success: true, auction: auction.getState() };
        } catch (error) {
            console.error(`Error starting auction ${auctionId}:`, error);
            return { success: false, message: 'Internal server error' };
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
            const endResult = await auction.endAuction();
            if (endResult.success) {
                console.log(`Auction ${auctionId} ended automatically`);
            } else {
                console.log(`Failed to end auction ${auctionId}:`, endResult.message);
                return;
            }

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