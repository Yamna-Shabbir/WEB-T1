const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    fullName: String,
    email: String,
    address: String,
    city: String,
    zipCode: String
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  paymentMethod: String,
  subtotal: Number,
  discount: { type: Number, default: 0 }, // Stores the discount amount
  total: Number,
  status: {
    type: String,
    default: 'Placed',
    enum: ['Placed', 'Processing', 'Delivered', 'Cancelled'] // Enforced Lifecycle States
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);