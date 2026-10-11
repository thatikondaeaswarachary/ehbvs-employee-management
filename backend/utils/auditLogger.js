import { create } from '../repositories/store.js';

export async function logAudit(actorUser, action, entity, entityId, metadata = {}) {
  try {
    await create('auditLogs', {
      actor: actorUser?._id || actorUser?.id || null,
      actorName: actorUser?.name || 'System Administrator',
      actorEmail: actorUser?.email || '',
      action,
      entity,
      entityId: String(entityId || ''),
      metadata,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}
