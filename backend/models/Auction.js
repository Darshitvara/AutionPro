const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Bid amount must be positive']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const participantSchema = new mongoose.Schema({
    socketId: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const auctionSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    product: {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [100, 'Product name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Product description cannot exceed 500 characters']
        },
        image: {
            type: String,
            default: 'https://via.placeholder.com/400x300?text=Auction+Item'
        },
        category: {
            type: String,
            default: 'General'
        }
    },
    startingPrice: {
        type: Number,
        required: [true, 'Starting price is required'],
        min: [1, 'Starting price must be at least 1']
    },
    currentPrice: {
        type: Number,
        required: true,
        min: [0, 'Current price cannot be negative']
    },
    highestBidder: {
        type: String,
        default: null
    },
    highestBidderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    participants: [participantSchema],
    status: {
        type: String,
        enum: ['upcoming', 'live', 'closed', 'cancelled', 'scheduled', 'active', 'ended'], // Temporarily allow old values
        default: 'upcoming'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    scheduledStartTime: {
        type: Date,
        required: false // Make it optional for backward compatibility
    },
    durationMinutes: {
        type: Number,
        default: 5, // Fixed 5 minutes duration
        min: [1, 'Duration must be at least 1 minute'],
        max: [60, 'Duration cannot exceed 60 minutes']
    },
    actualStartTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        required: false // Will be set when auction starts
    },
    actualEndTime: {
        type: Date,
        default: null // Will be set when auction actually ends
    },
    manuallyEnded: {
        type: Boolean,
        default: false
    },
    endedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    winnerUsername: {
        type: String,
        default: null
    },
    finalPrice: {
        type: Number,
        default: null
    },
    bidHistory: [bidSchema],
    warningShown: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for performance
auctionSchema.index({ status: 1, scheduledStartTime: 1 });
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ scheduledStartTime: 1 });

// Virtual for remaining time until start
auctionSchema.virtual('timeToStart').get(function() {
    if (this.status !== 'scheduled') return 0;
    const remaining = Math.max(0, this.scheduledStartTime.getTime() - Date.now());
    return Math.floor(remaining / 1000);
});

// Virtual for remaining time during auction
auctionSchema.virtual('remainingTime').get(function() {
    if (this.status !== 'live' || !this.endTime) return 0;
    const remaining = Math.max(0, this.endTime.getTime() - Date.now());
    return Math.floor(remaining / 1000);
});

// Methods compatible with existing implementation
// Middleware to migrate old status values before saving
auctionSchema.pre('save', function(next) {
    // Auto-migrate old status values
    const statusMigrations = {
        'scheduled': 'upcoming',
        'active': 'live',
        'ended': 'closed'
    };
    
    if (statusMigrations[this.status]) {
        this.status = statusMigrations[this.status];
    }
    
    next();
});

// Instance methods
auctionSchema.methods.addParticipant = function(socketId, userId, username) {
    // Check if participant already exists by socketId
    const existingIndex = this.participants.findIndex(p => p.socketId === socketId);
    
    if (existingIndex === -1) {
        this.participants.push({ socketId, userId, username });
    } else {
        // Update existing participant
        this.participants[existingIndex] = { socketId, userId, username, joinedAt: new Date() };
    }
    
    return this.save();
};

auctionSchema.methods.removeParticipant = function(socketId) {
    this.participants = this.participants.filter(p => p.socketId !== socketId);
    return this.save();
};

auctionSchema.methods.placeBid = function(socketId, userId, username, bidAmount) {
    if (!this.canBid()) {
        return { success: false, message: 'Bidding is not active' };
    }

    if (bidAmount <= this.currentPrice) {
        return {
            success: false,
            message: `Bid must be higher than current price ₹${this.currentPrice.toLocaleString('en-IN')}`
        };
    }

    // Update auction state
    this.currentPrice = bidAmount;
    this.highestBidder = username;
    this.highestBidderId = userId;
    
    this.bidHistory.push({
        userId,
        username,
        amount: bidAmount,
        timestamp: new Date()
    });

    // Ensure participant is added
    this.addParticipant(socketId, userId, username);

    return { success: true };
};

auctionSchema.methods.getRemainingTime = function() {
    if (this.status === 'upcoming') {
        // Time until auction starts
        if (!this.scheduledStartTime) return 0;
        return Math.max(0, this.scheduledStartTime.getTime() - Date.now());
    } else if (this.status === 'live') {
        // Time until auction ends
        if (!this.endTime) return 0;
        return Math.max(0, this.endTime.getTime() - Date.now());
    }
    return 0;
};

auctionSchema.methods.getTimeToStart = function() {
    if (this.status !== 'upcoming') return 0;
    const remaining = Math.max(0, this.scheduledStartTime.getTime() - Date.now());
    return Math.floor(remaining / 1000);
};

auctionSchema.methods.startAuction = async function() {
    // Accept both 'upcoming' and 'scheduled' status (to handle migration cases)
    const validStatuses = ['upcoming', 'scheduled'];
    if (!validStatuses.includes(this.status)) {
        console.log(`[DB] Auction ${this._id} cannot be started - status is '${this.status}', expected one of: ${validStatuses.join(', ')}`);
        return { success: false, message: `Auction cannot be started. Current status: ${this.status}` };
    }
    
    console.log(`[DB] Starting auction ${this._id} with status: ${this.status}`);
    
    // Store original values for rollback if needed
    const originalStatus = this.status;
    const originalIsActive = this.isActive;
    
    try {
        this.status = 'live';
        this.isActive = true;
        this.actualStartTime = new Date();
        this.endTime = new Date(Date.now() + (this.durationMinutes * 60 * 1000));
        
        console.log(`[DB] Auction ${this._id} scheduled to end at: ${this.endTime}`);
        
        // Save the changes to the database with retry logic
        let saveAttempts = 0;
        const maxAttempts = 3;
        
        while (saveAttempts < maxAttempts) {
            try {
                await this.save();
                console.log(`[DB] Auction ${this._id} successfully saved to database on attempt ${saveAttempts + 1}`);
                break;
            } catch (saveError) {
                saveAttempts++;
                console.error(`[DB] Save attempt ${saveAttempts} failed for auction ${this._id}:`, saveError.message);
                
                if (saveAttempts >= maxAttempts) {
                    // Rollback changes
                    this.status = originalStatus;
                    this.isActive = originalIsActive;
                    this.actualStartTime = null;
                    this.endTime = null;
                    
                    throw new Error(`Failed to save auction after ${maxAttempts} attempts: ${saveError.message}`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 100 * saveAttempts));
            }
        }
        
        // Verify the save was successful by checking the database
        const savedAuction = await this.constructor.findById(this._id);
        if (savedAuction.status !== 'live') {
            throw new Error('Database save verification failed - auction status not updated');
        }
        
        console.log(`[DB] Auction ${this._id} start operation completed successfully and verified in database`);
        return { success: true };
        
    } catch (error) {
        console.error(`[DB] Error starting auction ${this._id}:`, error.message);
        return { success: false, message: error.message };
    }
};

auctionSchema.methods.endAuction = async function(endedBy = null, manual = false) {
    if (this.status !== 'live') {
        console.log(`[DB] Cannot end auction ${this._id} - current status: ${this.status} (expected: live)`);
        return { success: false, message: 'Auction is not live' };
    }
    
    console.log(`[DB] Ending auction ${this._id}. Manual: ${manual}, EndedBy: ${endedBy}`);
    console.log(`[DB] Current auction state before ending:`, {
        status: this.status,
        isActive: this.isActive,
        currentPrice: this.currentPrice,
        highestBidder: this.highestBidder
    });
    
    try {
        // Update auction fields
        this.status = 'closed';
        this.isActive = false;
        this.manuallyEnded = manual;
        this.endedBy = endedBy;
        this.actualEndTime = new Date();
        
        // Set winner information
        if (this.highestBidder) {
            this.winnerId = this.highestBidderId;
            this.winnerUsername = this.highestBidder;
            this.finalPrice = this.currentPrice;
            console.log(`[DB] Winner determined: ${this.winnerUsername} with bid ₹${this.finalPrice}`);
        } else {
            // No bids received
            this.finalPrice = this.startingPrice;
            console.log(`[DB] No bids received, final price set to starting price: ₹${this.finalPrice}`);
        }
        
        console.log(`[DB] About to save auction ${this._id} with new status: ${this.status}`);
        
        // Save to database
        const savedDoc = await this.save();
        
        console.log(`[DB] Auction ${this._id} saved successfully. New status: ${savedDoc.status}`);
        console.log(`[DB] Final auction state:`, {
            status: savedDoc.status,
            isActive: savedDoc.isActive,
            manuallyEnded: savedDoc.manuallyEnded,
            actualEndTime: savedDoc.actualEndTime,
            winnerUsername: savedDoc.winnerUsername,
            finalPrice: savedDoc.finalPrice
        });
        
        return { success: true };
        
    } catch (error) {
        console.error(`[DB] Error ending auction ${this._id}:`, error);
        console.error(`[DB] Error details:`, error.message);
        console.error(`[DB] Error stack:`, error.stack);
        return { success: false, message: error.message };
    }
};

auctionSchema.methods.cancelAuction = function(cancelledBy) {
    if (this.status === 'closed') {
        return { success: false, message: 'Auction already closed' };
    }
    
    this.status = 'cancelled';
    this.isActive = false;
    this.endedBy = cancelledBy;
    
    return { success: true };
};

auctionSchema.methods.canBid = function() {
    return this.status === 'live' && this.isActive && this.getRemainingTime() > 0;
};

auctionSchema.methods.getState = function() {
    const timeRemaining = this.getRemainingTime();
    
    return {
        id: this._id.toString(),
        productName: this.productName,
        product: this.product || {
            name: this.productName,
            description: '',
            image: 'https://via.placeholder.com/400x300?text=Auction+Item',
            category: 'General'
        },
        startingPrice: this.startingPrice,
        currentPrice: this.currentPrice,
        highestBidder: this.highestBidder,
        highestBidderId: this.highestBidderId,
        status: this.status,
        isActive: this.isActive,
        scheduledStartTime: this.scheduledStartTime.getTime(),
        actualStartTime: this.actualStartTime ? this.actualStartTime.getTime() : null,
        remainingTime: this.status === 'active' ? Math.floor(timeRemaining / 1000) : 0,
        timeToStart: this.status === 'scheduled' ? Math.floor(timeRemaining / 1000) : 0,
        participantCount: this.participants.length,
        participants: this.participants.map(p => p.username),
        bidHistory: this.bidHistory.slice(-10), // Last 10 bids
        endTime: this.endTime ? this.endTime.getTime() : null,
        durationMinutes: this.durationMinutes,
        manuallyEnded: this.manuallyEnded,
        winnerId: this.winnerId,
        winnerUsername: this.winnerUsername,
        finalPrice: this.finalPrice
    };
};

// Migration helper for existing auctions
auctionSchema.methods.migrateToScheduledSystem = function() {
    // For existing auctions without status, determine the status
    if (!this.status) {
        const now = new Date();
        if (this.endTime && this.endTime > now) {
            this.status = 'live';
        } else {
            this.status = 'closed';
        }
    }
    
    // Update old status terminology to new terminology
    if (this.status === 'scheduled') this.status = 'upcoming';
    if (this.status === 'active') this.status = 'live';
    if (this.status === 'ended') this.status = 'closed';
    
    // For existing auctions without scheduledStartTime, set it to createdAt if needed
    if (!this.scheduledStartTime && this.status === 'upcoming') {
        this.scheduledStartTime = this.createdAt || new Date();
    }
};

// Pre-save middleware to update status based on time
auctionSchema.pre('save', function(next) {
    // Migrate existing auctions
    this.migrateToScheduledSystem();
    
    const now = new Date();
    
    // NOTE: Auto-start functionality has been removed - auctions must be started manually by admin
    // Auto-start upcoming auctions was here but removed for manual-only start system
    
    // Auto-end live auctions
    if (this.status === 'live' && this.endTime && this.endTime <= now) {
        this.endAuction(null, false);
    }
    
    next();
});

module.exports = mongoose.model('Auction', auctionSchema);
