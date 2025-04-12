// cloudinaryMiddleware.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'profile-pictures',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [
        { 
          width: 500, 
          height: 500, 
          crop: 'fill', 
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto'
        }
      ],
      public_id: `user-${req.user.id}-${Date.now()}`, // Unique filename
      overwrite: false // Prevent overwriting existing files
    };
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  }
});

module.exports = upload;