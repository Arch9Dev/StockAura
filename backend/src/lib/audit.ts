import { prisma } from '../prisma';

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId: number;
  userId: number;
  metadata?: object;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId,
      metadata: params.metadata,
    },
  });
}