const adminMiddleware = (req, res, next) => {
    try {
        // Check if user is authenticated (authMiddleware should run first)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

module.exports = { adminMiddleware };