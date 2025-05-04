// Error handling middleware
const errorMiddleware = (err, req, res, next) => {
    // Log error
    console.error(err.stack);
    
    // Default error status and message
    let statusCode = 500;
    let message = 'Server Error';
    
    // Check if error has status code and message
    if (err.statusCode) {
      statusCode = err.statusCode;
    }
    
    if (err.message) {
      message = err.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  };
  
  module.exports = errorMiddleware;