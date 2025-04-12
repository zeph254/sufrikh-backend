// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const response = {
      success: false,
      error: err.message || 'An error occurred'
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }
    
    res.status(err.status || 500).json(response);
  };
  
  module.exports = errorHandler;