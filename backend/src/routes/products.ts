import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET all products (active only by default)
router.get('/', authenticate, async (req, res) => {
  const { includeArchived } = req.query;
  const products = await prisma.product.findMany({
    where: includeArchived === 'true' ? undefined : { isActive: true },
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

// ARCHIVE product (soft delete — preserves stock movement history)
router.patch('/:id/archive', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

// RESTORE an archived product
router.patch('/:id/restore', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: { isActive: true },
    });
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

// DELETE product (only allowed if no stock history exists)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
    if (movementCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete a product with stock movement history. Archive it instead.',
      });
    }
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

export default router;