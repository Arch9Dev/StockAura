import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// GET all stock movements (optionally filtered by product)
router.get('/', authenticate, async (req, res) => {
  const { productId } = req.query;
  const movements = await prisma.stockMovement.findMany({
    where: productId ? { productId: Number(productId) } : undefined,
    include: { product: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(movements);
});

// CREATE a stock movement (this actually adjusts the product's quantity)
router.post('/', authenticate, requireRole('STAFF', 'MANAGER', 'ADMIN'), async (req, res) => {
  const { productId, type, quantity, note } = req.body;
  const userId = req.user!.userId;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Work out the quantity delta based on movement type
    let delta = 0;
    if (type === 'RESTOCK' || type === 'RETURN') delta = quantity;
    if (type === 'SALE') delta = -quantity;
    if (type === 'ADJUSTMENT') delta = quantity; // can be positive or negative

    const newQuantity = product.quantity + delta;
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock for this movement' });
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: { productId, type, quantity, note, userId },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      }),
    ]);

    res.status(201).json(movement);
  } catch (err) {
    res.status(400).json({ error: 'Failed to record stock movement', details: err });
  }
});

export default router;