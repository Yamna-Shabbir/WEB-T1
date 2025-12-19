const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// Preview Order
router.get('/preview', (req, res) => {
  const cart = req.session.cart || [];

  if (cart.length === 0) return res.redirect('/cart');

  let grandTotal = 0;
  cart.forEach(item => {
    item.total = item.price * item.quantity;
    grandTotal += item.total;
  });

  res.render('order/preview', { cart, grandTotal });
});

// Confirm Order
router.post('/confirm', async (req, res) => {
  const cart = req.session.cart || [];

  if (!cart.length) return res.redirect('/cart');

  const grandTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  try {
    const order = new Order({
      items: cart,
      total: grandTotal,
      status: 'Placed'
    });

    await order.save();

    // Clear cart session
    req.session.cart = [];

    res.redirect(`/order/success/${order._id}`);
  } catch (err) {
    console.error(err);
    res.redirect('/cart');
  }
});

// Success Page
router.get('/success/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.redirect('/shop');

    res.render('order/success', { order });
  } catch (err) {
    console.error(err);
    res.redirect('/shop');
  }
});

module.exports = router;
