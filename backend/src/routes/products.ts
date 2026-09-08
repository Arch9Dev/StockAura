import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/audit';

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

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    return res.status(409).json({
      error: `SKU "${sku}" is already in use${existing.isActive ? '' : ' by an archived product'}.`,
    });
  }

  try {
    const product = await prisma.product.create({
      data: { name, sku, description, price, quantity, lowStockAlert, supplierId },
    });
    await logAudit({
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      userId: req.user!.userId,
      metadata: { name: product.name, sku: product.sku },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(400).json({ error: 'Failed to create product' });
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
    await logAudit({
      action: 'UPDATE',
      entity: 'Product',
      entityId: product.id,
      userId: req.user!.userId,
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
    await logAudit({
      action: 'ARCHIVE',
      entity: 'Product',
      entityId: product.id,
      userId: req.user!.userId,
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
    await logAudit({
      action: 'RESTORE',
      entity: 'Product',
      entityId: product.id,
      userId: req.user!.userId,
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
    await logAudit({
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      userId: req.user!.userId,
    });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Product not found' });
  }
});

export default router;