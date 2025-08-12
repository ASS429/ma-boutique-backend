const express = require('express');
const cors = require('cors');
require('dotenv').config(); // pour charger .env en local

const app = express();
const port = process.env.PORT || 3000; // Render fournit PORT automatiquement

app.use(cors());
app.use(express.json());

// Routes
app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/sales', require('./routes/sales'));
app.use('/tontines', require('./routes/tontines'));

app.listen(port, () => {
  console.log(`✅ Backend lancé sur http://localhost:${port}`);
});
