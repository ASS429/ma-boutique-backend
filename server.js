const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/sales', require('./routes/sales'));
app.use('/tontines', require('./routes/tontines'));
app.use('/stats', require('./routes/stats'));
app.use('/auth', require('./routes/auth'));


// Test route
app.get('/', (req, res) => {
  res.send('✅ API en ligne et opérationnelle !');
});

app.listen(port, () => {
  console.log(`🚀 Backend lancé sur http://localhost:${port}`);
});
