import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../lib/audit';

const router = Router();

// GET all users (ADMIN only)
router.get('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// UPDATE a user's role (ADMIN only)
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { role } = req.body;
  const targetId = Number(req.params.id);

  if (!['STAFF', 'MANAGER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (targetId === req.user!.userId) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    await logAudit({
      action: 'ROLE_CHANGE',
      entity: 'User',
      entityId: user.id,
      userId: req.user!.userId,
      metadata: { newRole: role },
    });
    res.json(user);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

// DELETE a user (ADMIN only)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const targetId = Number(req.params.id);

  if (targetId === req.user!.userId) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  try {
    await prisma.user.delete({ where: { id: targetId } });
    await logAudit({
      action: 'DELETE',
      entity: 'User',
      entityId: targetId,
      userId: req.user!.userId,
    });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({
      error: 'Could not delete user. They may have stock movement history linked to their account.',
    });
  }
});

export default router;