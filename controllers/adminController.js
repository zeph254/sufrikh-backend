const bcrypt = require('bcryptjs');
const { Prisma } = require('@prisma/client');
const { generateTempPassword } = require('../utils/authHelpers');

exports.createAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;
    const currentAdminId = req.user.id;

    // Generate secure temp password
    const tempPassword = generateTempPassword(12);
    
    const newAdmin = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        password: await bcrypt.hash(tempPassword, 12),
        role: 'ADMIN',
        is_verified: true,
        invited_by: currentAdminId
      },
      select: { id: true, email: true }
    });

    // Send email with setup link (implement separately)
    await sendAdminInviteEmail(email, tempPassword);

    res.status(201).json({
      success: true,
      message: 'Admin invitation sent',
      userId: newAdmin.id
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

exports.listAdmins = async (req, res) => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      created_at: true
    }
  });
  res.json({ admins });
};