const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Auction state management
const auctions = new Map();

class Auction {
    constructor(id, productName, startingPrice, durationMinutes = 2) {
        this.id = id;
        this.productName = productName;
        this.startingPrice = startingPrice;
        this.currentPrice = startingPrice;
        this.highestBidder = null;
        this.participants = new Map(); // socketId -> username
        this.isActive = true;
        this.durationMinutes = durationMinutes;
        this.endTime = Date.now() + (durationMinutes * 60 * 1000);
        this.bidHistory = [];
        this.timer = null;
        this.warningShown = false;
    }

    addParticipant(socketId, username) {
        this.participants.set(socketId, username);
    }

    removeParticipant(socketId) {
        this.participants.delete(socketId);
    }

    placeBid(socketId, username, bidAmount) {
        if (!this.isActive) {
            return { success: false, message: 'Auction has ended' };
        }

        if (bidAmount <= this.currentPrice) {
            return { 
                success: false, 
                message: `Bid must be higher than current price ₹${this.currentPrice}` 
            };
        }

        // Update auction state
        this.currentPrice = bidAmount;
        this.highestBidder = username;
        this.bidHistory.push({
            username,
            amount: bidAmount,
            timestamp: Date.now()
        });

        return { success: true };
    }

    getRemainingTime() {
        const remaining = Math.max(0, this.endTime - Date.now());
        return Math.floor(remaining / 1000); // Return seconds
    }

    endAuction() {
        this.isActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getState() {
        return {
            id: this.id,
            productName: this.productName,
            startingPrice: this.startingPrice,
            currentPrice: this.currentPrice,
            highestBidder: this.highestBidder,
            isActive: this.isActive,
            remainingTime: this.getRemainingTime(),
            participantCount: this.participants.size,
            participants: Array.from(this.participants.values())
        };
    }
}

// Initialize default auction
const defaultAuction = new Auction('auction-1', 'Vintage Watch', 1000, 2);
auctions.set('auction-1', defaultAuction);

// Start auction timer
function startAuctionTimer(auctionId) {
    const auction = auctions.get(auctionId);
    if (!auction) return;

    auction.timer = setInterval(() => {
        const remainingTime = auction.getRemainingTime();
        
        // Broadcast time update
        io.to(auctionId).emit('timer-update', {
            remainingTime,
            isActive: auction.isActive
        });

        // Show warning at 10 seconds
        if (remainingTime <= 10 && !auction.warningShown && auction.isActive) {
            auction.warningShown = true;
            io.to(auctionId).emit('notification', {
                type: 'warning',
                message: 'Auction ending soon! Only 10 seconds left!'
            });
        }

        // End auction when time is up
        if (remainingTime <= 0 && auction.isActive) {
            auction.endAuction();
            
            const winnerMessage = auction.highestBidder
                ? `Auction ended! Winner: ${auction.highestBidder} with ₹${auction.currentPrice}`
                : 'Auction ended! No bids were placed.';

            io.to(auctionId).emit('auction-ended', {
                winner: auction.highestBidder,
                finalPrice: auction.currentPrice,
                message: winnerMessage
            });

            io.to(auctionId).emit('notification', {
                type: 'success',
                message: winnerMessage
            });

            clearInterval(auction.timer);
        }
    }, 1000);
}

// Start the default auction timer
startAuctionTimer('auction-1');

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Join auction room
    socket.on('join-auction', ({ auctionId, username }) => {
        const auction = auctions.get(auctionId);
        
        if (!auction) {
            socket.emit('error', { message: 'Auction not found' });
            return;
        }

        // Join the auction room
        socket.join(auctionId);
        socket.auctionId = auctionId;
        socket.username = username;

        // Add participant to auction
        auction.addParticipant(socket.id, username);

        // Send current auction state to the new user
        socket.emit('auction-state', auction.getState());

        // Notify everyone that a new user joined
        io.to(auctionId).emit('user-joined', {
            username,
            participantCount: auction.participants.size
        });

        io.to(auctionId).emit('notification', {
            type: 'info',
            message: `${username} has joined the auction`
        });

        console.log(`${username} joined auction ${auctionId}`);
    });

    // Handle bid placement
    socket.on('place-bid', ({ auctionId, bidAmount }) => {
        const auction = auctions.get(auctionId);
        
        if (!auction) {
            socket.emit('error', { message: 'Auction not found' });
            return;
        }

        const username = socket.username;
        const result = auction.placeBid(socket.id, username, bidAmount);

        if (result.success) {
            // Broadcast the new bid to all participants
            io.to(auctionId).emit('bid-placed', {
                username,
                bidAmount,
                currentPrice: auction.currentPrice,
                highestBidder: auction.highestBidder
            });

            io.to(auctionId).emit('notification', {
                type: 'success',
                message: `${username} placed a bid of ₹${bidAmount}`
            });

            console.log(`${username} placed bid: ₹${bidAmount}`);
        } else {
            // Send error only to the bidder
            socket.emit('bid-rejected', {
                message: result.message
            });

            socket.emit('notification', {
                type: 'error',
                message: result.message
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const auctionId = socket.auctionId;
        const username = socket.username;

        if (auctionId && username) {
            const auction = auctions.get(auctionId);
            if (auction) {
                auction.removeParticipant(socket.id);
                
                io.to(auctionId).emit('user-left', {
                    username,
                    participantCount: auction.participants.size
                });

                io.to(auctionId).emit('notification', {
                    type: 'info',
                    message: `${username} has left the auction`
                });
            }
        }

        console.log('User disconnected:', socket.id);
    });

    // Request auction state (for reconnections or refresh)
    socket.on('request-state', ({ auctionId }) => {
        const auction = auctions.get(auctionId);
        if (auction) {
            socket.emit('auction-state', auction.getState());
        }
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Auction server running on http://localhost:${PORT}`);
    console.log(`📦 Auction: ${defaultAuction.productName}`);
    console.log(`💰 Starting Price: ₹${defaultAuction.startingPrice}`);
    console.log(`⏱️  Duration: ${defaultAuction.durationMinutes} minutes`);
});
