import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/users', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get all doctors (admin only)
router.get('/doctors', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: {
        doctorInfo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
});

// Get all appointments (admin only)
router.get('/appointments', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: { name: true, email: true },
        },
        doctor: {
          select: { name: true, email: true },
        },
        payment: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
});

// Get audit logs (admin only)
router.get('/audit-logs', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 logs
    });

    res.json(logs);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE_USER',
        resource: 'USER',
        details: `Deleted user ${id}`,
      },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

export default router;
