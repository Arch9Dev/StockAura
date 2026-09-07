import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all suppliers
router.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    include: { products: true },
  });
  res.json(suppliers);
});

// GET one supplier
router.get('/:id', async (req, res) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: Number(req.params.id) },
    include: { products: true },
  });
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
  res.json(supplier);
});

// CREATE supplier
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const supplier = await prisma.supplier.create({
      data: { name, email, phone },
    });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create supplier', details: err });
  }
});

// UPDATE supplier
router.put('/:id', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone },
    });
    res.json(supplier);
  } catch (err) {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'Supplier not found' });
  }
});

export default router;