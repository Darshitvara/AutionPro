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

auctionSchema.methods.startAuction = function() {
    if (this.status !== 'upcoming') {
        return { success: false, message: 'Auction cannot be started' };
    }
    
    this.status = 'live';
    this.isActive = true;
    this.actualStartTime = new Date();
    this.endTime = new Date(Date.now() + (this.durationMinutes * 60 * 1000));
    
    return { success: true };
};

auctionSchema.methods.endAuction = function(endedBy = null, manual = false) {
    if (this.status !== 'live') {
        return { success: false, message: 'Auction is not live' };
    }
    
    this.status = 'closed';
    this.isActive = false;
    this.manuallyEnded = manual;
    this.endedBy = endedBy;
    
    // Set winner information
    if (this.highestBidder) {
        this.winnerId = this.highestBidderId;
        this.winnerUsername = this.highestBidder;
        this.finalPrice = this.currentPrice;
    }
    
    return { success: true };
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
    
    // Auto-start upcoming auctions
    if (this.status === 'upcoming' && this.scheduledStartTime && this.scheduledStartTime <= now) {
        this.startAuction();
    }
    
    // Auto-end live auctions
    if (this.status === 'live' && this.endTime && this.endTime <= now) {
        this.endAuction(null, false);
    }
    
    next();
});

module.exports = mongoose.model('Auction', auctionSchema);
