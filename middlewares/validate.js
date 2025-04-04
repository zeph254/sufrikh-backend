const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        fields: ['name', 'email', 'password']
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
        fields: ['password']
      });
    }
    
    next();
  };