/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * Not found handler
 */
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.originalUrl}`
    });
};

/**
 * Async handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler
};
