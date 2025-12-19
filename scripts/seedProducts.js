const mongoose = require('mongoose');
const Product = require('../models/Product');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym-supplies-hub';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const sampleProducts = [
  {
    name: 'LED Fibre Optic Lamp',
    description: 'Sensory Light Projector - Perfect for relaxation and sensory therapy',
    price: 99.99,
    category: 'Electronics',
    image: '/images/sensoryimg.jpeg',
    stock: 25,
  },
  {
    name: 'Rocket Scooter',
    description: 'High-quality scooter for outdoor activities and exercise',
    price: 149.99,
    category: 'Equipment',
    image: '/images/rocketimg.jpeg',
    stock: 15,
  },
  {
    name: 'Sensory Equipment Kit',
    description: 'Complete sensory kit with various therapeutic tools',
    price: 199.99,
    category: 'Equipment',
    image: '/images/sensoryequipimg.jpeg',
    stock: 10,
  },
  {
    name: 'Premium Headphones',
    description: 'High-quality wireless headphones for workouts',
    price: 79.99,
    category: 'Electronics',
    image: '/images/headphoneimg.jpeg',
    stock: 30,
  },
  {
    name: 'Fitness Watch',
    description: 'Smart fitness tracker with heart rate monitor',
    price: 129.99,
    category: 'Electronics',
    image: '/images/watchimg.jpeg',
    stock: 20,
  },
  {
    name: 'Training Equipment Set',
    description: 'Complete training equipment set for home gym',
    price: 299.99,
    category: 'Equipment',
    image: '/images/equip2.png',
    stock: 8,
  },
  {
    name: 'Sound Adapter',
    description: 'Premium sound adapter for audio equipment',
    price: 49.99,
    category: 'Accessories',
    image: '/images/soundad-img.jpeg',
    stock: 40,
  },
  {
    name: 'Phone Stand',
    description: 'Adjustable phone stand for workout videos',
    price: 24.99,
    category: 'Accessories',
    image: '/images/phone.png',
    stock: 50,
  },
  {
    name: 'Premium Gym Bag',
    description: 'Durable gym bag with multiple compartments',
    price: 59.99,
    category: 'Accessories',
    image: '/images/bp-img1.svg',
    stock: 35,
  },
  {
    name: 'Workout Gloves',
    description: 'Professional workout gloves with padding',
    price: 34.99,
    category: 'Clothing',
    image: '/images/bp-img2.svg',
    stock: 45,
  },
  {
    name: 'Resistance Bands Set',
    description: 'Set of 5 resistance bands with different resistance levels',
    price: 39.99,
    category: 'Equipment',
    image: '/images/bp-img3.webp',
    stock: 28,
  },
  {
    name: 'Yoga Mat',
    description: 'Premium non-slip yoga mat with carrying strap',
    price: 44.99,
    category: 'Equipment',
    image: '/images/bp-img5.webp',
    stock: 32,
  },
  {
    name: 'Dumbbell Set',
    description: 'Adjustable dumbbell set (5-25 lbs per dumbbell)',
    price: 179.99,
    category: 'Equipment',
    image: '/images/bp-img6.webp',
    stock: 12,
  },
  {
    name: 'Protein Shaker',
    description: 'BPA-free protein shaker bottle with measurement marks',
    price: 19.99,
    category: 'Accessories',
    image: '/images/bp-img7.webp',
    stock: 60,
  },
  {
    name: 'Fitness Tracker Band',
    description: 'Waterproof fitness tracker with step counter',
    price: 89.99,
    category: 'Electronics',
    image: '/images/bp-img8.webp',
    stock: 22,
  },
  {
    name: 'Kettlebell',
    description: 'Cast iron kettlebell - 20 lbs',
    price: 64.99,
    category: 'Equipment',
    image: '/images/bp-img9.webp',
    stock: 18,
  },
  {
    name: 'Foam Roller',
    description: 'High-density foam roller for muscle recovery',
    price: 29.99,
    category: 'Equipment',
    image: '/images/bp-img10.webp',
    stock: 25,
  },
  {
    name: 'Gym Towel Set',
    description: 'Pack of 3 quick-dry gym towels',
    price: 27.99,
    category: 'Accessories',
    image: '/images/bp-img1.svg',
    stock: 38,
  },
  {
    name: 'Workout Tank Top',
    description: 'Moisture-wicking tank top for intense workouts',
    price: 32.99,
    category: 'Clothing',
    image: '/images/bp-img2.svg',
    stock: 42,
  },
  {
    name: 'Jump Rope',
    description: 'Professional speed jump rope with adjustable length',
    price: 16.99,
    category: 'Equipment',
    image: '/images/bp-img3.webp',
    stock: 55,
  },
  {
    name: 'Massage Gun',
    description: 'Percussion massage gun for muscle recovery',
    price: 159.99,
    category: 'Electronics',
    image: '/images/bp-img5.webp',
    stock: 14,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Successfully seeded ${products.length} products`);
    
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedProducts();

