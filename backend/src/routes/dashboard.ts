import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, async (req, res) => {
  const [totalProducts, allActiveProducts, recentMovements] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),

    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, quantity: true, lowStockAlert: true },
    }),

    prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const lowStockProducts = allActiveProducts.filter((p) => p.quantity <= p.lowStockAlert);

  res.json({
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentMovements,
  });
});

export default router;