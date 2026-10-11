import { list, findById, create, update, remove, count } from '../repositories/store.js';
import { isOverdue } from '../utils/calculations.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getTasks(req, res, next) {
  try {
    const { status, priority, department, assignedTo, search } = req.query;

    let query = {};
    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (assignedTo && assignedTo !== 'All') query.assignedTo = assignedTo;

    let tasks = await list('tasks', query, { createdAt: -1 });

    if (department && department !== 'All') {
      tasks = tasks.filter(t => t.department === department || t.assignedTo?.department === department);
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      tasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(term) ||
        t.taskId?.toLowerCase().includes(term) ||
        t.assignedTo?.name?.toLowerCase().includes(term)
      );
    }

    const enriched = tasks.map(t => ({
      ...t,
      isOverdue: t.status !== 'Completed' && isOverdue(t.deadline)
    }));

    return res.json({
      success: true,
      count: enriched.length,
      tasks: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTasks(req, res, next) {
  try {
    const employeeId = req.user._id;
    const { status } = req.query;

    let query = { assignedTo: employeeId };
    if (status && status !== 'All') query.status = status;

    const tasks = await list('tasks', query, { deadline: 1 });

    const enriched = tasks.map(t => ({
      ...t,
      isOverdue: t.status !== 'Completed' && isOverdue(t.deadline)
    }));

    return res.json({
      success: true,
      count: enriched.length,
      tasks: enriched
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;
    const task = await findById('tasks', id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Role check: employee can only see tasks assigned to them
    const assignedId = task.assignedTo?._id || task.assignedTo;
    if (req.user.role !== 'ADMIN' && String(assignedId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this task.' });
    }

    return res.json({
      success: true,
      task: {
        ...task,
        isOverdue: task.status !== 'Completed' && isOverdue(task.deadline)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const {
      title,
      description,
      assignedTo,
      department,
      priority = 'Medium',
      startDate,
      deadline,
      status = 'Not Started',
      remarks
    } = req.body;

    if (!title || !assignedTo || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Task Title, Assigned Employee, and Deadline are required.'
      });
    }

    // Generate unique Task ID (e.g. TSK-1001)
    const taskCount = await count('tasks');
    const taskId = `TSK-${String(taskCount + 1001).padStart(4, '0')}`;

    const newTask = await create('tasks', {
      taskId,
      title: title.trim(),
      description: (description || '').trim(),
      assignedTo,
      department: department || 'Engineering',
      priority,
      startDate: startDate || new Date().toISOString().split('T')[0],
      deadline,
      status,
      progress: status === 'Completed' ? 100 : 0,
      remarks: remarks || '',
      completedAt: status === 'Completed' ? new Date().toISOString() : null,
      createdBy: req.user._id
    });

    // Notify the assigned employee
    await create('notifications', {
      user: assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned task: "${title}". Deadline: ${deadline}.`,
      type: 'task',
      link: `/employee/tasks/${newTask._id}`
    });

    await logAudit(req.user, 'TASK_CREATED', 'Task', newTask._id, {
      taskId,
      title,
      assignedTo
    });

    const populated = await findById('tasks', newTask._id);

    return res.status(201).json({
      success: true,
      message: `Task ${taskId} created and assigned successfully.`,
      task: populated
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignedTo,
      department,
      priority,
      startDate,
      deadline,
      status,
      progress,
      remarks
    } = req.body;

    const existing = await findById('tasks', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (department) updateData.department = department;
    if (priority) updateData.priority = priority;
    if (startDate) updateData.startDate = startDate;
    if (deadline) updateData.deadline = deadline;
    if (remarks !== undefined) updateData.remarks = remarks;

    if (progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, Number(progress)));
    }

    if (status) {
      updateData.status = status;
      if (status === 'Completed') {
        updateData.progress = 100;
        updateData.completedAt = new Date().toISOString();
      }
    }

    const updated = await update('tasks', id, updateData);

    await logAudit(req.user, 'TASK_UPDATED', 'Task', id, updateData);

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, progress, remarks } = req.body;

    const task = await findById('tasks', id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const assignedId = task.assignedTo?._id || task.assignedTo;
    if (req.user.role !== 'ADMIN' && String(assignedId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this task.' });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'Completed') {
        updateData.progress = 100;
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (progress !== undefined) {
      updateData.progress = Math.max(0, Math.min(100, Number(progress)));
      if (updateData.progress === 100) {
        updateData.status = 'Completed';
        updateData.completedAt = new Date().toISOString();
      }
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const updated = await update('tasks', id, updateData);

    await logAudit(req.user, 'TASK_STATUS_UPDATED', 'Task', id, {
      status: updated.status,
      progress: updated.progress
    });

    return res.json({
      success: true,
      message: 'Task progress and status updated successfully.',
      task: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await findById('tasks', id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    await remove('tasks', id);
    await logAudit(req.user, 'TASK_DELETED', 'Task', id, {
      taskId: existing.taskId,
      title: existing.title
    });

    return res.json({
      success: true,
      message: `Task ${existing.taskId || id} deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
}
