const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 4000;

// Middleware
const allowedOrigins = [
  'https://ma-boutique-frontend1.onrender.com', // frontend Render
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);                // ex: Postman
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/sales', require('./routes/sales'));
app.use('/tontines', require('./routes/tontines'));
app.use('/stats', require('./routes/stats'));

// Test route
app.get('/', (req, res) => {
  res.send('✅ API en ligne et opérationnelle !');
});


app.listen(port, () => {
  console.log(`🚀 Backend lancé sur http://localhost:${port}`);
});
