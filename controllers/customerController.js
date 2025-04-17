const prisma = require('../prisma/client');
const bcrypt = require('bcryptjs');

// Get all customers (admin only)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
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
        special_requests: true,
        is_active: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      count: customers.length,
      customers: customers.map(customer => ({
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        gender: customer.gender,
        idType: customer.id_type,
        idNumber: customer.id_number,
        prayerInRoom: customer.prayer_in_room,
        noAlcohol: customer.no_alcohol,
        zabihahOnly: customer.zabihah_only,
        specialRequests: customer.special_requests,
        isActive: customer.is_active,
        createdAt: customer.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create customer (admin only)
exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, gender, idType, idNumber } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, phone, and password are required'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const customer = await prisma.user.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'CUSTOMER',
        gender: gender || 'male',
        id_type: idType || 'passport',
        id_number: idNumber || '',
        prayer_in_room: req.body.prayerInRoom || false,
        no_alcohol: req.body.noAlcohol ?? true,
        zabihah_only: req.body.zabihahOnly ?? true,
        special_requests: req.body.specialRequests || '',
        is_verified: true
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

    res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        gender: customer.gender,
        idType: customer.id_type,
        idNumber: customer.id_number,
        prayerInRoom: customer.prayer_in_room,
        noAlcohol: customer.no_alcohol,
        zabihahOnly: customer.zabihah_only,
        specialRequests: customer.special_requests
      },
      message: 'Customer created successfully'
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update customer (admin only)
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      gender, 
      idType, 
      idNumber,
      prayerInRoom,
      noAlcohol,
      zabihahOnly,
      specialRequests,
      isActive
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, email, and phone are required'
      });
    }

    const updatedCustomer = await prisma.user.update({
      where: { 
        id: parseInt(id),
        role: 'CUSTOMER'
      },
      data: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        gender: gender || 'male',
        id_type: idType || 'passport',
        id_number: idNumber || '',
        prayer_in_room: prayerInRoom || false,
        no_alcohol: noAlcohol ?? true,
        zabihah_only: zabihahOnly ?? true,
        special_requests: specialRequests || '',
        is_active: isActive !== undefined ? isActive : true
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
        special_requests: true,
        is_active: true
      }
    });

    res.json({
      success: true,
      customer: {
        id: updatedCustomer.id,
        firstName: updatedCustomer.first_name,
        lastName: updatedCustomer.last_name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        gender: updatedCustomer.gender,
        idType: updatedCustomer.id_type,
        idNumber: updatedCustomer.id_number,
        prayerInRoom: updatedCustomer.prayer_in_room,
        noAlcohol: updatedCustomer.no_alcohol,
        zabihahOnly: updatedCustomer.zabihah_only,
        specialRequests: updatedCustomer.special_requests,
        isActive: updatedCustomer.is_active
      },
      message: 'Customer updated successfully'
    });
  } catch (err) {
    console.error('Error updating customer:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete customer (admin only)
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // First verify customer exists
    const customer = await prisma.user.findUnique({
      where: { 
        id: parseInt(id),
        role: 'CUSTOMER'
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting customer:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with existing relations'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Toggle customer status (admin only)
exports.toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.user.findUnique({
      where: { 
        id: parseInt(id),
        role: 'CUSTOMER'
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const updatedCustomer = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { 
        is_active: !customer.is_active 
      },
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
      customer: {
        id: updatedCustomer.id,
        firstName: updatedCustomer.first_name,
        lastName: updatedCustomer.last_name,
        email: updatedCustomer.email,
        isActive: updatedCustomer.is_active
      },
      message: `Customer ${updatedCustomer.is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error('Error toggling customer status:', err);
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to toggle customer status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};