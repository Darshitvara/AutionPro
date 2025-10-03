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
    isActive: {
        type: Boolean,
        default: true
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: [1, 'Duration must be at least 1 minute'],
        max: [1440, 'Duration cannot exceed 24 hours'] // 24 hours in minutes
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        required: true
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
auctionSchema.index({ isActive: 1, endTime: 1 });
auctionSchema.index({ endTime: 1 });

// Virtual for remaining time
auctionSchema.virtual('remainingTime').get(function() {
    const remaining = Math.max(0, this.endTime.getTime() - Date.now());
    return Math.floor(remaining / 1000);
});

// Methods compatible with existing implementation
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
    if (!this.isActive) {
        return { success: false, message: 'Auction has ended' };
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
    const remaining = Math.max(0, this.endTime.getTime() - Date.now());
    return Math.floor(remaining / 1000);
};

auctionSchema.methods.endAuction = function() {
    this.isActive = false;
    return this.save();
};

auctionSchema.methods.getState = function() {
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
        isActive: this.isActive,
        remainingTime: this.getRemainingTime(),
        participantCount: this.participants.length,
        participants: this.participants.map(p => p.username),
        bidHistory: this.bidHistory.slice(-10), // Last 10 bids
        startTime: this.startTime.getTime(),
        endTime: this.endTime.getTime()
    };
};

// Pre-save middleware to update status based on time
auctionSchema.pre('save', function(next) {
    const now = new Date();
    
    if (this.endTime <= now && this.isActive) {
        this.isActive = false;
    }
    
    next();
});

module.exports = mongoose.model('Auction', auctionSchema);
