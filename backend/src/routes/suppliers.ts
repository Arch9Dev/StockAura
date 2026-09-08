import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

// GET all suppliers
router.get('/', authenticate, async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    include: { products: true },
  });
  res.json(suppliers);
});

// GET one supplier
router.get('/:id', authenticate, async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: Number(req.params.id) },
    include: { products: true },
  });
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  res.json(supplier);
});

// CREATE supplier
router.post('/', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const supplier = await prisma.supplier.create({
      data: { name, email, phone },
    });
    await logAudit({
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      userId: req.user!.userId,
      metadata: { name: supplier.name },
    });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create supplier', details: err });
  }
});

// UPDATE supplier
router.put('/:id', authenticate, requireRole('MANAGER', 'ADMIN'), async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone },
    });
    await logAudit({
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: supplier.id,
      userId: req.user!.userId,
    });
    res.json(supplier);
  } catch (err) {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

// DELETE supplier
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const productCount = await prisma.product.count({ where: { supplierId: id } });
    if (productCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete a supplier with linked products. Reassign or remove those products first.',
      });
    }
    await prisma.supplier.delete({ where: { id } });
    await logAudit({
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
      userId: req.user!.userId,
    });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

export default router;