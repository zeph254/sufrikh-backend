// middlewares/ownershipCheck.js
exports.checkUserOwnership = (req, res, next) => {
    if (parseInt(req.params.id) !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to perform this action'
      });
    }
    next();
  };