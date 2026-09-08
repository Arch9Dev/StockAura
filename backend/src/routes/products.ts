import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET all products
router.get('/', authenticate, async (req, res) => {
  const products = await prisma.product.findMany({
    include: { supplier: true },
  });
  res.json(products);
});

// GET one product
router.get('/:id', authenticate, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { supplier: true },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// CREATE product
router.post('/', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, sku, description, price, quantity, lowStockAlert, supplierId } = req.body;
  try {
    const product = await prisma.product.create({
      data: { name, sku, description, price, quantity, lowStockAlert, supplierId },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create product', details: err });
  }
});

// UPDATE product
router.put('/:id', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, sku, description, price, quantity, lowStockAlert, supplierId } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { name, sku, description, price, quantity, lowStockAlert, supplierId },
    });
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

// DELETE product
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

export default router;