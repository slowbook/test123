import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { processPayment } from '../services/payment.js';

const router = express.Router();
const prisma = new PrismaClient();

// Process payment for appointment
router.post('/', authenticate, async (req, res) => {
  try {
    const { appointmentId, sourceId } = req.body;
    const userId = req.user.userId;

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!appointment.payment) {
      return res.status(400).json({ message: 'No payment record found' });
    }

    if (appointment.payment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Process payment with Square
    const paymentResult = await processPayment({
      sourceId,
      amount: appointment.payment.amount,
      currency: appointment.payment.currency,
      appointmentId: appointment.id,
    });

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: appointment.payment.id },
      data: {
        status: 'COMPLETED',
        squarePaymentId: paymentResult.paymentId,
        squareReceiptUrl: paymentResult.receiptUrl,
      },
    });

    // Update appointment status to confirmed
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
    });

    res.json({
      message: 'Payment successful',
      payment: updatedPayment,
      receiptUrl: paymentResult.receiptUrl,
    });
  } catch (error) {
    console.error('Payment error:', error);

    // Update payment status to failed
    if (req.body.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: req.body.appointmentId },
        include: { payment: true },
      });

      if (appointment?.payment) {
        await prisma.payment.update({
          where: { id: appointment.payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
});

// Get payment status
router.get('/:appointmentId', authenticate, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId !== userId && appointment.doctorId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(appointment.payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'Failed to fetch payment', error: error.message });
  }
});

export default router;
