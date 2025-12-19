const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/* =========================
   ADD TO CART
========================= */
router.get('/add/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.redirect('/shop');

    if (!req.session.cart) req.session.cart = [];

    const cart = req.session.cart;

    const existingItem = cart.find(
      item => item.productId.toString() === product._id.toString()
    );

    if (existingItem) existingItem.quantity += 1;
    else
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image
      });

    res.redirect('/shop');
  } catch (err) {
    console.error(err);
    res.redirect('/shop');
  }
});

/* =========================
   VIEW CART
========================= */
router.get('/', (req, res) => {
  const cart = req.session.cart || [];

  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  res.render('cart', { cart, total });
});

module.exports = router;
