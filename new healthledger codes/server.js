const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const recordRoutes = require('./routes/records');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HealthLedger API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for root path (splash screen)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'splash screen.html'));
});

// Serve HTML files directly
app.get('/homedashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'homedashboard.html'));
});

app.get('/welcomelogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'welcomelogin.html'));
});

app.get('/newpatientstep1', (req, res) => {
  res.sendFile(path.join(__dirname, 'newpatientstep1.html'));
});

app.get('/recorddetail', (req, res) => {
  res.sendFile(path.join(__dirname, 'record detail.html'));
});

// Catch-all handler: send back index.html for any other routes (for SPA-like behavior)
app.get('*', (req, res) => {
  // Check if the requested file exists
  const filePath = path.join(__dirname, req.path);
  if (req.path.includes('.html')) {
    const fileName = req.path.split('/').pop();
    res.sendFile(path.join(__dirname, fileName));
  } else {
    res.sendFile(path.join(__dirname, 'homedashboard.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HealthLedger server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;