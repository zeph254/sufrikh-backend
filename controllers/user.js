const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');
const cloudinary = require('../utils/cloudinary'); // Adjust path as needed

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true
      }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        gender: true,
        id_type: true,
        id_number: true,
        prayer_in_room: true,
        no_alcohol: true,
        zabihah_only: true,
        special_requests: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        idType: user.id_type,
        idNumber: user.id_number,
        prayerInRoom: user.prayer_in_room,
        noAlcohol: user.no_alcohol,
        zabihahOnly: user.zabihah_only,
        specialRequests: user.special_requests,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated this way
    delete updateData.password;
    delete updateData.role;
    delete updateData.is_super_admin;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        first_name: updateData.firstName,
        last_name: updateData.lastName,
        phone: updateData.phone,
        gender: updateData.gender,
        id_type: updateData.idType,
        id_number: updateData.idNumber,
        prayer_in_room: updateData.prayerInRoom,
        no_alcohol: updateData.noAlcohol,
        zabihah_only: updateData.zabihahOnly,
        special_requests: updateData.specialRequests
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        gender: true,
        id_type: true,
        id_number: true,
        prayer_in_room: true,
        no_alcohol: true,
        zabihah_only: true,
        special_requests: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        idType: updatedUser.id_type,
        idNumber: updatedUser.id_number,
        prayerInRoom: updatedUser.prayer_in_room,
        noAlcohol: updatedUser.no_alcohol,
        zabihahOnly: updatedUser.zabihah_only,
        specialRequests: updatedUser.special_requests
      }
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

// userController.js
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: "No image file provided",
        code: "MISSING_IMAGE"
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "User authentication required",
        code: "AUTH_REQUIRED"
      });
    }

    // Get current profile picture
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profile_picture: true }
    });

    // Delete old image if exists
    if (currentUser?.profile_picture) {
      try {
        const publicId = currentUser.profile_picture
          .split('/')
          .pop()
          .split('.')[0];
        await cloudinary.uploader.destroy(`profile-pictures/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Old image deletion error:', cloudinaryError);
      }
    }

    // Update user with new secure URL
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        profile_picture: req.file.path // Cloudinary provides secure_url in path
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        profile_picture: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        profilePicture: updatedUser.profile_picture,
        message: "Profile picture updated successfully"
      }
    });

  } catch (error) {
    console.error('Profile upload error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: "USER_NOT_FOUND"
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile picture',
      code: "UPLOAD_FAILED"
    });
  }
};