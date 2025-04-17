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
    const { firstName, lastName, email, phone, position, department, password } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, first name, last name, and password are required' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create worker
    const worker = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        role: 'WORKER',
        position,
        phone,
        department,
        is_verified: true,
        invited_by_id: req.user.id
      },
      select: {  // Explicitly select fields to return
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
        department: true,
        phone: true
      }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        action: 'CREATE_WORKER',
        adminId: req.user.id,
        targetId: worker.id,
        metadata: { position, department }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Worker created successfully',
      worker  // Make sure this matches the select fields
    });

  } catch (err) {
    console.error('Worker creation error:', err);
    
    // Handle Prisma errors specifically
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }
    
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Worker creation failed' 
    });
  }
};
exports.toggleWorkerStatus = async (req, res) => {
  try {
    const worker = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id), role: 'WORKER' }
    });

    if (!worker) {
      return res.status(404).json({ success: false, error: 'Worker not found' });
    }

    const updatedWorker = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { is_active: !worker.is_active },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_active: true
      }
    });

    res.json({ 
      success: true,
      worker: updatedWorker
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to toggle worker status' 
    });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { 
        role: 'WORKER',
        is_active: true // Only get active workers by default
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        is_active: true,
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
    const { firstName, lastName, email, phone, position, department, isActive } = req.body;

    // Validate required fields
    if (!position || !department) {
      return res.status(400).json({ 
        success: false,
        error: 'Position and department are required' 
      });
    }

    const updatedWorker = await prisma.user.update({
      where: { id: parseInt(id), role: 'WORKER' },
      data: { 
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        position,
        department,
        is_active: isActive
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        position: true,
        department: true,
        is_active: true,
        created_at: true
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
    console.error('Update error:', err);
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
// // Add this function to adminController.js
// exports.listAdmins = async (req, res) => {
//     try {
//       const admins = await prisma.user.findMany({
//         where: { role: 'ADMIN' },
//         select: {
//           id: true,
//           first_name: true,
//           last_name: true,
//           email: true,
//           is_super_admin: true,
//           created_at: true
//         },
//         orderBy: { created_at: 'desc' }
//       });
  
//       res.json({ 
//         success: true,
//         count: admins.length,
//         admins 
//       });
  
//     } catch (err) {
//       res.status(500).json({ 
//         success: false,
//         error: 'Failed to fetch admins' 
//       });
//     }
//   };
  exports.getAdmins = async (req, res) => {
    try {
      const admins = await prisma.user.findMany({
        where: { 
          role: 'ADMIN',
          is_active: true
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          is_super_admin: true,
          is_active: true,
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

// module.exports = {
  exports.deleteWorker = async (req, res) => {
    try {
      const { id } = req.params;
      const workerId = parseInt(id);
  
      // 1. First verify worker exists and get details for audit log
      const worker = await prisma.user.findUnique({
        where: { id: workerId, role: 'WORKER' },
        select: { id: true, email: true, first_name: true, last_name: true }
      });
  
      if (!worker) {
        return res.status(404).json({ 
          success: false, 
          error: 'Worker not found' 
        });
      }
  
      // 2. Create audit log BEFORE deletion
      await prisma.adminAuditLog.create({
        data: {
          action: 'DELETE_WORKER',
          adminId: req.user.id,
          targetId: workerId,
          metadata: {
            deletedWorker: `${worker.first_name} ${worker.last_name}`,
            email: worker.email
          }
        }
      });
  
      // 3. Now delete the worker
      await prisma.user.delete({
        where: { id: workerId }
      });
  
      return res.json({ 
        success: true,
        message: 'Worker deleted successfully'
      });
  
    } catch (err) {
      console.error('Delete worker error:', err);
      
      let statusCode = 500;
      let errorMessage = 'Failed to delete worker';
      
      if (err.code === 'P2025') {
        statusCode = 404;
        errorMessage = 'Worker not found';
      } else if (err.code === 'P2003') {
        statusCode = 400;
        errorMessage = 'Cannot delete worker with existing relations';
      }
  
      return res.status(statusCode).json({ 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
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