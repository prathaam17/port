const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, User } = require('./models');
const seedDatabase = require('./seed');

// Import routes
const authRoutes = require('./routes/auth');
const cargoRoutes = require('./routes/cargo');
const warehouseRoutes = require('./routes/warehouse');
const customsRoutes = require('./routes/customs');
const gateRoutes = require('./routes/gate');
const billingRoutes = require('./routes/billing');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/customs', customsRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.use('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NMPA Port API Server is running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Sync Database and Start Server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models (creates tables if they do not exist)
    // Note: Use { alter: true } to update tables if modified, or default sync
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    // Auto-seed if database is empty
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Database is empty. Initiating auto-seeding...');
      await seedDatabase();
    } else {
      console.log(`Database already has user records (${userCount}). Skipping auto-seed.`);
    }

    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  PORT INVENTORY SYSTEM SERVER RUNNING ON PORT ${PORT}`);
      console.log(`  Local Health Check: http://localhost:${PORT}/api/health`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Unable to start the backend server:', error);
    process.exit(1);
  }
};

startServer();
