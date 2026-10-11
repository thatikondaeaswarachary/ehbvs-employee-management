import { findOne, create, update } from '../repositories/store.js';
import { company } from '../config/company.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getSettings(req, res, next) {
  try {
    let settingsDoc = await findOne('settings', { key: 'global_system_settings' });

    if (!settingsDoc) {
      const defaultSettings = {
        key: 'global_system_settings',
        value: {
          companyName: company.name,
          companyEmail: company.email,
          companyPhone: company.phone,
          companyAddress: company.address,
          workStartTime: company.workingHoursConfig.workStartTime,
          workEndTime: company.workingHoursConfig.workEndTime,
          dailyWorkHoursTarget: company.workingHoursConfig.workDayHours,
          lateGraceMinutes: company.workingHoursConfig.lateGraceMinutes,
          requireDailyWorkReport: true,
          emailNotificationsEnabled: false,
          enableHeartbeatMonitoring: true
        }
      };
      settingsDoc = await create('settings', defaultSettings);
    }

    return res.json({
      success: true,
      settings: settingsDoc.value
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    let settingsDoc = await findOne('settings', { key: 'global_system_settings' });

    const newValues = {
      ...(settingsDoc?.value || {}),
      ...req.body
    };

    let updated;
    if (settingsDoc) {
      updated = await update('settings', settingsDoc._id, { value: newValues });
    } else {
      updated = await create('settings', { key: 'global_system_settings', value: newValues });
    }

    await logAudit(req.user, 'SETTINGS_UPDATED', 'Setting', updated._id, req.body);

    return res.json({
      success: true,
      message: 'System settings updated successfully.',
      settings: updated.value
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { limit = 100 } = req.query;
    const { list } = await import('../repositories/store.js');
    const logs = await list('auditLogs', {}, { createdAt: -1 });

    return res.json({
      success: true,
      count: logs.length,
      logs: logs.slice(0, Number(limit))
    });
  } catch (err) {
    next(err);
  }
}
