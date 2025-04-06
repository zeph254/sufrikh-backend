const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma/client');
const { generateTempPassword } = require('../utils/authHelpers');
const { sendInviteEmail } = require('../services/emailService');

// Admin Management
exports.createAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, isSuperAdmin = false } = req.body;
    
    // Only super admins can create other admins
    if (!req.user.is_super_admin) {
      return res.status(403).json({ 
        success: false,
        error: 'Super admin privileges required' 
      });
    }

    const tempPassword = generateTempPassword(12);
    const newAdmin = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password: await bcrypt.hash(tempPassword, 12),
        role: 'ADMIN',
        is_super_admin: isSuperAdmin,
        is_verified: true,
        invited_by_id: req.user.id
      },
      select: { 
        id: true, 
        email: true, 
        role: true,
        is_super_admin: true 
      }
    });

    // Log this admin action
    await prisma.adminAuditLog.create({
      data: {
        action: 'CREATE_ADMIN',
        adminId: req.user.id,
        targetId: newAdmin.id,
        metadata: { isSuperAdmin }
      }
    });

    await sendInviteEmail({
      email,
      tempPassword,
      type: 'admin',
      inviterName: `${req.user.first_name} ${req.user.last_name}`
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: newAdmin
    });

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(400).json({ 
          success: false,
          error: 'Email already in use' 
        });
      }
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to create admin' 
    });
  }
};

// Worker Management
exports.createWorker = async (req, res) => {
  try {
    const { email, firstName, lastName, position, department } = req.body;

    const tempPassword = generateTempPassword(12);
    const worker = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password: await bcrypt.hash(tempPassword, 12),
        role: 'WORKER',
        position,
        department,
        is_verified: true,
        invited_by_id: req.user.id
      },
      select: { 
        id: true, 
        email: true, 
        position: true,
        department: true 
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'CREATE_WORKER',
        adminId: req.user.id,
        targetId: worker.id,
        metadata: { position, department }
      }
    });

    await sendInviteEmail({
      email,
      tempPassword,
      type: 'worker',
      inviterName: `${req.user.first_name} ${req.user.last_name}`
    });

    res.status(201).json({
      success: true,
      message: 'Worker account created',
      worker
    });

  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        error: 'Email already in use' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Worker creation failed' 
    });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        department: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ 
      success: true,
      count: workers.length,
      workers 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch workers' 
    });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, department } = req.body;

    const updatedWorker = await prisma.user.update({
      where: { id: parseInt(id), role: 'WORKER' },
      data: { position, department },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        position: true,
        department: true
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'UPDATE_WORKER',
        adminId: req.user.id,
        targetId: updatedWorker.id,
        metadata: { position, department }
      }
    });

    res.json({ 
      success: true,
      message: 'Worker updated successfully',
      worker: updatedWorker
    });

  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Worker not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to update worker' 
    });
  }
};
// Add this function to adminController.js
exports.listAdmins = async (req, res) => {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          is_super_admin: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      });
  
      res.json({ 
        success: true,
        count: admins.length,
        admins 
      });
  
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch admins' 
      });
    }
  };

exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id), role: 'WORKER' }
    });

    await prisma.adminAuditLog.create({
      data: {
        action: 'DELETE_WORKER',
        adminId: req.user.id,
        targetId: parseInt(id)
      }
    });

    res.json({ 
      success: true,
      message: 'Worker deleted successfully' 
    });

  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        error: 'Worker not found' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete worker' 
    });
  }
};
// At the bottom of adminController.js ensure you have:
// module.exports = {
//     createAdmin,
//     listAdmins,
//     createWorker,
//     getWorkers,
//     updateWorker,
//     deleteWorker
//   };