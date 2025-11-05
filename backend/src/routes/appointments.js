import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { randomBytes } from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Get appointments for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let appointments;

    if (userRole === 'PATIENT') {
      appointments = await prisma.appointment.findMany({
        where: { patientId: userId },
        include: {
          doctor: {
            select: { name: true },
          },
          payment: true,
        },
        orderBy: { scheduledAt: 'desc' },
      });
    } else if (userRole === 'DOCTOR') {
      appointments = await prisma.appointment.findMany({
        where: { doctorId: userId },
        include: {
          patient: {
            select: { name: true },
          },
          payment: true,
        },
        orderBy: { scheduledAt: 'desc' },
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Decrypt sensitive data
    const decryptedAppointments = appointments.map((apt) => ({
      id: apt.id,
      patientName: userRole === 'DOCTOR' ? apt.patient.name : 'You',
      doctorName: userRole === 'PATIENT' ? apt.doctor.name : 'You',
      specialty: apt.specialty,
      symptoms: decrypt(apt.symptoms),
      healthConcern: decrypt(apt.healthConcern),
      status: apt.status,
      roomId: apt.roomId,
      scheduledAt: apt.scheduledAt,
      payment: apt.payment,
    }));

    res.json(decryptedAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
});

// Create appointment
router.post('/', authenticate, async (req, res) => {
  try {
    const { age, symptoms, healthConcern, specialty, doctorId } = req.body;
    const patientId = req.user.userId;

    // Verify doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Generate unique room ID
    const roomId = randomBytes(16).toString('hex');

    // Encrypt sensitive data
    const encryptedSymptoms = encrypt(symptoms);
    const encryptedHealthConcern = encrypt(healthConcern);

    // Create appointment (auto-confirmed for testing)
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        symptoms: encryptedSymptoms,
        healthConcern: encryptedHealthConcern,
        specialty,
        roomId,
        status: 'CONFIRMED', // Auto-confirm for testing (skip payment)
      },
    });

    // Create completed payment (skip payment gateway for testing)
    await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: 50.0, // Base consultation fee
        currency: 'USD',
        status: 'COMPLETED', // Mark as completed to skip payment
        squarePaymentId: 'test_payment_' + roomId,
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Failed to create appointment', error: error.message });
  }
});

// Accept appointment (doctor)
router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.userId;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Accept appointment error:', error);
    res.status(500).json({ message: 'Failed to accept appointment', error: error.message });
  }
});

// Complete appointment
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId !== userId && appointment.patientId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ message: 'Failed to complete appointment', error: error.message });
  }
});

export default router;
