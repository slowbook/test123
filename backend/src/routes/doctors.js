import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get available doctors
router.get('/', authenticate, async (req, res) => {
  try {
    const { specialty } = req.query;

    const whereClause = { role: 'DOCTOR' };

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        doctorInfo: {
          select: {
            specialty: true,
            available: true,
            bio: true,
          },
        },
      },
    });

    // Filter by specialty if provided
    const filteredDoctors = specialty
      ? doctors.filter((doc) => doc.doctorInfo?.specialty === specialty)
      : doctors;

    const formattedDoctors = filteredDoctors.map((doc) => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.doctorInfo?.specialty || 'General Medicine',
      available: doc.doctorInfo?.available ?? true,
      bio: doc.doctorInfo?.bio,
    }));

    res.json(formattedDoctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
});

// Create or update doctor profile
router.post('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { specialty, licenseNumber, bio } = req.body;

    // Verify user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.role !== 'DOCTOR') {
      return res.status(403).json({ message: 'Only doctors can create a profile' });
    }

    // Check if profile already exists
    const existingProfile = await prisma.doctorInfo.findUnique({
      where: { userId },
    });

    let doctorInfo;

    if (existingProfile) {
      // Update existing profile
      doctorInfo = await prisma.doctorInfo.update({
        where: { userId },
        data: {
          specialty,
          licenseNumber,
          bio,
          available: true,
        },
      });
    } else {
      // Create new profile
      doctorInfo = await prisma.doctorInfo.create({
        data: {
          userId,
          specialty,
          licenseNumber,
          bio,
          available: true,
        },
      });
    }

    res.status(201).json(doctorInfo);
  } catch (error) {
    console.error('Create doctor profile error:', error);
    res.status(500).json({ message: 'Failed to create profile', error: error.message });
  }
});

// Get doctor's own profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const doctorInfo = await prisma.doctorInfo.findUnique({
      where: { userId },
    });

    if (!doctorInfo) {
      return res.status(404).json({ message: 'Profile not found', hasProfile: false });
    }

    res.json({ ...doctorInfo, hasProfile: true });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

export default router;
