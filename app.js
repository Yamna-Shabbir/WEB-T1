const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./config/database');
const Product = require('./models/Product');
const { protectAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');



const app = express();
const PORT = 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret:'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images, JS) from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes (before other routes)
app.use('/api/auth', authRoutes);

// Routes
app.get('/', (req, res) => {
  res.render('pages/index');
});
app.get('/checkout', (req, res) => {
  res.render('pages/checkout');
});

// Shop route with pagination and filtering
app.get('/shop', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category;
    }
    
    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice);
      }
    }
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Fetch products with pagination
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get unique categories for filter dropdown
    const categories = await Product.distinct('category');
    
    // Get price range for filter
    let minPrice = 0;
    let maxPrice = 1000;
    const priceStats = await Product.aggregate([
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }
    ]);
    if (priceStats.length > 0 && priceStats[0].minPrice !== null) {
      minPrice = priceStats[0].minPrice;
      maxPrice = priceStats[0].maxPrice;
    }
    
    res.render('pages/shop', {
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      limit,
      categories,
      minPrice,
      maxPrice,
      currentCategory: req.query.category || 'all',
      currentMinPrice: req.query.minPrice || '',
      currentMaxPrice: req.query.maxPrice || '',
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('pages/shop', {
      title: 'Shop - Gym Supplies Hub',
      page: 'shop',
      products: [],
      error: 'Error loading products. Please try again later.',
    });
  }
});

app.get('/about', (req, res) => {
  res.render('pages/about');
});

app.get('/contact', (req, res) => {
  res.render('pages/contact');
});

// ==================== ADMIN ROUTES ====================

// Admin Login Page (public)
app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

// Admin Signup Page (public)
app.get('/admin/signup', (req, res) => {
  res.render('admin/signup');
});

// Admin Dashboard (protected - redirects to login if not authenticated)
app.get('/admin', protectAdmin, (req, res) => {
  res.render('admin/dashboard', { 
    user: req.user
  });
});

// Admin Products List (protected)
app.get('/admin/products', protectAdmin, (req, res) => {
  res.render('admin/products', {
    user: req.user
  });
});

// Admin Add Product Form (protected)
app.get('/admin/products/add', protectAdmin, (req, res) => {
  res.render('admin/add-product', {
    user: req.user
  });
});

// Admin Edit Product Form (protected)
app.get('/admin/products/:id/edit', protectAdmin, (req, res) => {
  res.render('admin/edit-product', {
    user: req.user
  });
});

// ==================== API ROUTES (CRUD) ====================

// READ - Get all products (with optional limit)
app.get('/api/products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || null;
    const query = Product.find().sort({ createdAt: -1 });
    
    if (limit) {
      query.limit(limit);
    }
    
    const products = await query;
    res.json({ 
      success: true, 
      products: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products',
      error: error.message 
    });
  }
});

// READ - Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true, 
      product: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product',
      error: error.message 
    });
  }
});

// CREATE - Add new product
app.post('/api/products', async (req, res) => {
  try {
    console.log('📥 Received product data:', req.body);
    
    const { name, description, price, image, category, stock } = req.body;
    
    // Validation - check for empty strings and null/undefined
    if (!name || !name.trim() || !description || !description.trim() || 
        price === undefined || price === null || price === '' || 
        !image || !image.trim() || !category || !category.trim()) {
      console.log('❌ Validation failed:', { 
        name: name || 'MISSING', 
        description: description || 'MISSING', 
        price: price !== undefined ? price : 'MISSING', 
        image: image || 'MISSING', 
        category: category || 'MISSING' 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields (name, description, price, image, category)',
        received: { 
          name: !!(name && name.trim()), 
          description: !!(description && description.trim()), 
          price: price !== undefined && price !== null && price !== '', 
          image: !!(image && image.trim()), 
          category: !!(category && category.trim()) 
        }
      });
    }
    
    // Validate price is a number
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0 || !isFinite(priceNum)) {
      console.log('❌ Invalid price:', price, 'parsed as:', priceNum);
      return res.status(400).json({ 
        success: false, 
        message: 'Price must be a valid positive number',
        receivedPrice: price,
        parsedPrice: priceNum
      });
    }
    
    // Validate category is in allowed list
    const allowedCategories = ['Equipment', 'Accessories', 'Clothing', 'Supplements', 'Electronics'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: `Category must be one of: ${allowedCategories.join(', ')}` 
      });
    }
    
    // Validate stock
    const stockNum = stock ? parseInt(stock) : 0;
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock must be a valid non-negative number' 
      });
    }
    
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      image: image.trim(),
      category: category.trim(),
      stock: stockNum,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('💾 Attempting to save product to MongoDB...');
    console.log('Product object:', {
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock
    });
    
    const savedProduct = await product.save();
    
    // Log to console for verification
    console.log('✅ Product saved to MongoDB:', {
      id: savedProduct._id,
      name: savedProduct.name,
      category: savedProduct.category,
      price: savedProduct.price
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Validation error: ${errors}`,
        error: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error creating product',
      error: error.message 
    });
  }
});

// UPDATE - Update existing product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    
    // Validation
    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: parseFloat(price),
        image,
        category,
        stock: stock ? parseInt(stock) : 0,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Log to console for verification
    console.log('✅ Product updated in MongoDB:', {
      id: product._id,
      name: product.name,
      category: product.category,
      price: product.price
    });
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product',
      error: error.message 
    });
  }
});

// DELETE - Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Log to console for verification
    console.log('✅ Product deleted from MongoDB:', {
      id: product._id,
      name: product.name
    });
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product',
      error: error.message 
    });
  }
});

// Admin Stats API
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categories = await Product.distinct('category');
    const totalStock = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCategories: categories.length,
        totalStock: totalStock.length > 0 ? totalStock[0].total : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Newsletter subscription route
app.post('/newsletter/subscribe', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please fill in all fields' 
    });
  }
  
  // In a real application, you would save this to a database
  console.log(`Newsletter subscription: ${name} - ${email}`);
  
  res.json({ 
    success: true, 
    message: 'Subscribed successfully!' 
  });
});

// Checkout processing route
app.post('/checkout/process', (req, res) => {
  const { fullName, email, address, city, zipCode, paymentMethod } = req.body;

  if (!fullName || !email || !address || !city || !zipCode || !paymentMethod) {
    return res.status(400).send('Please fill in all required fields');
  }

  if (paymentMethod === 'card') {
    const { cardNumber, expiryDate, cvv } = req.body;
    if (!cardNumber || !expiryDate || !cvv) {
      return res.status(400).send('Please fill in all card details');
    }
  } else if (paymentMethod === 'paypal') {
    const { paypalEmail } = req.body;
    if (!paypalEmail) return res.status(400).send('Please fill in PayPal email');
  } else if (paymentMethod === 'bank') {
    const { bankAccount, bankName } = req.body;
    if (!bankAccount || !bankName) return res.status(400).send('Please fill in bank details');
  }

  // All good → redirect to thank you page
  res.redirect('/thankyou');
});

//tyy
app.get('/thankyou', (req, res) => {
  res.render('pages/thankyou', { 
    title: 'Thank You - Gym Supplies Hub',
    page: 'checkout' // you can keep 'checkout' if you want nav highlighting same
  });
});


// Contact form submission route
app.post('/contact/submit', (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please fill in all fields' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Thank you for contacting us! We will get back to you soon.' 
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin/login`);
});

