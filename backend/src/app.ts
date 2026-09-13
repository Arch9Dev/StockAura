import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import suppliersRouter from './routes/suppliers';
import authRouter from './routes/auth';
import stockMovementsRouter from './routes/stockMovements';
import dashboardRouter from './routes/dashboard';
import usersRouter from './routes/users';

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/products', productsRouter);
app.use('/suppliers', suppliersRouter);
app.use('/auth', authRouter);
app.use('/stock-movements', stockMovementsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.json({ message: 'StockAura API is running' });
});

export default app;