import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productsRouter from './routes/products';
import suppliersRouter from './routes/suppliers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/products', productsRouter);
app.use('/suppliers', suppliersRouter);

app.get('/', (req, res) => {
  res.json({ message: 'StockAura API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});