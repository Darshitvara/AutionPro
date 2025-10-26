const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const { socketAuthMiddleware } = require('../middleware/authMiddleware');

class SocketService {
    constructor(io) {
        this.io = io;
        this.setupMiddleware();
        this.setupConnectionHandler();
    }

    setupMiddleware() {
        // Apply authentication middleware
        this.io.use(socketAuthMiddleware);
    }

    setupConnectionHandler() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.user.username} (${socket.id})`);

            // Join auction room
            socket.on('join-auction', (data) => this.handleJoinAuction(socket, data));

            // Place bid
            socket.on('place-bid', (data) => this.handlePlaceBid(socket, data));

            // Request auction state
            socket.on('request-state', (data) => this.handleRequestState(socket, data));

            // Disconnect
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    /**
     * Handle user joining auction
     */
    async handleJoinAuction(socket, data) {
        try {
            console.log('Join auction request:', data);
            
            // Handle multiple formats:
            // 1. Direct string: "auctionId"
            // 2. Object with auctionId string: { auctionId: "id" }
            // 3. Object with auctionId object: { auctionId: { id: "id", ... } }
            let auctionId;
            
            if (typeof data === 'string') {
                auctionId = data;
            } else if (data?.auctionId) {
                if (typeof data.auctionId === 'string') {
                    auctionId = data.auctionId;
                } else if (data.auctionId?.id) {
                    auctionId = data.auctionId.id;
                }
            }
            
            if (!auctionId) {
                console.log('No auction ID provided');
                socket.emit('error', { message: 'Auction ID is required' });
                return;
            }

            console.log('Looking for auction with ID:', auctionId);
            const auction = await Auction.findById(auctionId);

            if (!auction) {
                console.log('Auction not found for ID:', auctionId);
                socket.emit('error', { message: 'Auction not found' });
                return;
            }

            console.log('Found auction:', auction.productName);

            // Join the auction room
            socket.join(auctionId);
            socket.auctionId = auctionId;

            // Add participant to auction
            await auction.addParticipant(socket.id, socket.user.userId, socket.user.username);

            // Send current auction state to the new user
            socket.emit('auction-state', auction.getState());

            // Notify everyone that a new user joined
            this.io.to(auctionId).emit('user-joined', {
                username: socket.user.username,
                participantCount: auction.participants.length,
                participants: auction.participants.map(p => p.username)
            });

            this.io.to(auctionId).emit('notification', {
                type: 'info',
                message: `${socket.user.username} has joined the auction`
            });

            console.log(`${socket.user.username} joined auction ${auctionId}`);
        } catch (error) {
            console.error('Join auction error:', error);
            const payload = { message: 'Server error', where: 'join-auction', details: error?.message };
            socket.emit('error', payload);
            socket.emit('socket-error', payload);
        }
    }

    /**
     * Handle bid placement
     */
    async handlePlaceBid(socket, payload) {
        try {
            console.log('[SOCKET] place-bid payload:', payload);
            // Defensive parsing
            const auctionId = typeof payload === 'object' ? payload.auctionId : undefined;
            const rawAmount = typeof payload === 'object' ? payload.bidAmount : undefined;

            if (!auctionId) {
                socket.emit('bid-rejected', { message: 'Invalid request: missing auctionId' });
                return;
            }
            if (!mongoose.Types.ObjectId.isValid(auctionId)) {
                socket.emit('bid-rejected', { message: 'Invalid auction ID' });
                return;
            }

            const bidAmount = Number(rawAmount);
            if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
                socket.emit('bid-rejected', { message: 'Invalid bid amount' });
                return;
            }

            // Single atomic update to avoid full document save and reduce latency
            const now = new Date();
            const updated = await Auction.findOneAndUpdate(
                {
                    _id: auctionId,
                    status: 'live',
                    isActive: true,
                    endTime: { $gt: now },
                    currentPrice: { $lt: bidAmount }
                },
                {
                    $set: {
                        currentPrice: bidAmount,
                        highestBidder: socket.user.username,
                        highestBidderId: socket.user.userId,
                        updatedAt: now
                    },
                    $push: {
                        bidHistory: {
                            userId: socket.user.userId,
                            username: socket.user.username,
                            amount: bidAmount,
                            timestamp: now
                        }
                    }
                },
                { new: true }
            );

            if (!updated) {
                // Either auction not found/active, auction ended, or bid not higher than current price
                socket.emit('bid-rejected', { message: 'Bid must be higher and auction must be live' });
                return;
            }

            // Broadcast confirmation and authoritative updated state to all participants
            this.io.to(auctionId).emit('bid-placed', {
                userId: socket.user.userId,
                username: socket.user.username,
                bidAmount,
                currentPrice: updated.currentPrice,
                highestBidder: updated.highestBidder
            });

            // Send the updated auction state (trim bid history for live payload to reduce size)
            try {
                const state = updated.getState();
                if (Array.isArray(state.bidHistory) && state.bidHistory.length > 50) {
                    state.bidHistory = state.bidHistory.slice(-50);
                }
                this.io.to(auctionId).emit('auction-state', state);
            } catch (stateErr) {
                console.error('Error generating auction state after bid:', stateErr);
            }

            this.io.to(auctionId).emit('notification', {
                type: 'success',
                message: `${socket.user.username} placed a bid of ₹${bidAmount.toLocaleString('en-IN')}`
            });

            console.log(`${socket.user.username} placed bid: ₹${bidAmount}`);
        } catch (error) {
            console.error('Place bid error:', error);
            const payload = { message: 'Server error', where: 'place-bid', details: error?.message };
            socket.emit('error', payload);
            socket.emit('socket-error', payload);
        }
    }

    /**
     * Handle request for auction state
     */
    async handleRequestState(socket, { auctionId }) {
        try {
            const auction = await Auction.findById(auctionId);

            if (auction) {
                const state = auction.getState();
                if (state.status === 'live' && Array.isArray(state.bidHistory) && state.bidHistory.length > 50) {
                    state.bidHistory = state.bidHistory.slice(-50);
                }
                socket.emit('auction-state', state);
            } else {
                socket.emit('error', { message: 'Auction not found' });
            }
        } catch (error) {
            console.error('Request state error:', error);
            const payload = { message: 'Server error', where: 'request-state', details: error?.message };
            socket.emit('error', payload);
            socket.emit('socket-error', payload);
        }
    }

    /**
     * Handle user disconnect
     */
    async handleDisconnect(socket) {
        try {
            const auctionId = socket.auctionId;
            const username = socket.user.username;

            if (auctionId && username) {
                const auction = await Auction.findById(auctionId);
                if (auction) {
                    await auction.removeParticipant(socket.id);

                    this.io.to(auctionId).emit('user-left', {
                        username,
                        participantCount: auction.participants.length,
                        participants: auction.participants.map(p => p.username)
                    });

                    this.io.to(auctionId).emit('notification', {
                        type: 'info',
                        message: `${username} has left the auction`
                    });
                }
            }

            console.log(`User disconnected: ${username} (${socket.id})`);
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Start auction timer
     */
    async startAuctionTimer(auctionId) {
        try {
            const auction = await Auction.findById(auctionId);
            if (!auction) return;

            const timer = setInterval(async () => {
                try {
                    const updatedAuction = await Auction.findById(auctionId);
                    if (!updatedAuction) {
                        clearInterval(timer);
                        return;
                    }

                    const remainingTime = updatedAuction.getRemainingTime();

                    // Broadcast time update
                    this.io.to(auctionId).emit('timer-update', {
                        remainingTime,
                        isActive: updatedAuction.isActive
                    });

                    // Show warning at 10 seconds
                    if (remainingTime <= 10 && !updatedAuction.warningShown && updatedAuction.isActive) {
                        updatedAuction.warningShown = true;
                        await updatedAuction.save();

                        this.io.to(auctionId).emit('notification', {
                            type: 'warning',
                            message: 'Auction ending soon! Only 10 seconds left!'
                        });
                    }

                    // End auction when time is up
                    if (remainingTime <= 0 && updatedAuction.isActive) {
                        await updatedAuction.endAuction();

                        const winnerMessage = updatedAuction.highestBidder
                            ? `Auction ended! Winner: ${updatedAuction.highestBidder} with ₹${updatedAuction.currentPrice.toLocaleString('en-IN')}`
                            : 'Auction ended! No bids were placed.';

                        this.io.to(auctionId).emit('auction-ended', {
                            winner: updatedAuction.highestBidder,
                            winnerId: updatedAuction.highestBidderId,
                            finalPrice: updatedAuction.currentPrice,
                            message: winnerMessage
                        });

                        this.io.to(auctionId).emit('notification', {
                            type: 'success',
                            message: winnerMessage
                        });

                        clearInterval(timer);
                        console.log(`Auction ${auctionId} ended`);
                    }
                } catch (error) {
                    console.error('Timer error:', error);
                    clearInterval(timer);
                }
            }, 1000);
        } catch (error) {
            console.error('Start timer error:', error);
        }
    }
}

module.exports = SocketService;
