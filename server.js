const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/products', require('./routes/products'));
app.use('/categories', require('./routes/categories'));
app.use('/sales', require('./routes/sales'));
app.use('/tontines', require('./routes/tontines'));

app.listen(port, () => {
  console.log(`✅ Backend lancé sur http://localhost:${port}`);
});
