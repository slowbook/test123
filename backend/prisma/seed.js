import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@telehealth.com' },
    update: {},
    create: {
      email: 'admin@telehealth.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create Doctors
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  
  const doctors = [
    {
      email: 'dr.smith@telehealth.com',
      name: 'Dr. Sarah Smith',
      specialty: 'General Medicine',
      licenseNumber: 'GM12345',
      experience: 10,
    },
    {
      email: 'dr.johnson@telehealth.com',
      name: 'Dr. Michael Johnson',
      specialty: 'Cardiology',
      licenseNumber: 'CD23456',
      experience: 15,
    },
    {
      email: 'dr.williams@telehealth.com',
      name: 'Dr. Emily Williams',
      specialty: 'Dermatology',
      licenseNumber: 'DM34567',
      experience: 8,
    },
    {
      email: 'dr.brown@telehealth.com',
      name: 'Dr. James Brown',
      specialty: 'Pediatrics',
      licenseNumber: 'PD45678',
      experience: 12,
    },
    {
      email: 'dr.davis@telehealth.com',
      name: 'Dr. Lisa Davis',
      specialty: 'Psychiatry',
      licenseNumber: 'PS56789',
      experience: 9,
    },
  ];

  for (const doctorData of doctors) {
    const doctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {},
      create: {
        email: doctorData.email,
        password: doctorPassword,
        name: doctorData.name,
        role: 'DOCTOR',
      },
    });

    await prisma.doctorInfo.upsert({
      where: { userId: doctor.id },
      update: {},
      create: {
        userId: doctor.id,
        specialty: doctorData.specialty,
        licenseNumber: doctorData.licenseNumber,
        available: true,
        bio: `Experienced ${doctorData.specialty} specialist with ${doctorData.experience} years of practice.`,
      },
    });

    console.log('✅ Created doctor:', doctor.name, '-', doctorData.specialty);
  }

  // Create Sample Patients
  const patientPassword = await bcrypt.hash('patient123', 10);
  
  const patients = [
    {
      email: 'john.doe@example.com',
      name: 'John Doe',
    },
    {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.user.upsert({
      where: { email: patientData.email },
      update: {},
      create: {
        email: patientData.email,
        password: patientPassword,
        name: patientData.name,
        role: 'PATIENT',
      },
    });

      await prisma.patientInfo.upsert({
      where: { userId: patient.id },
      update: {},
      create: {
        userId: patient.id,
      },
    });

    console.log('✅ Created patient:', patient.name);
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@telehealth.com');
  console.log('  Password: admin123');
  console.log('\nDoctors (all use password: doctor123):');
  doctors.forEach((doc) => {
    console.log(`  - ${doc.name} (${doc.specialty}): ${doc.email}`);
  });
  console.log('\nPatients (all use password: patient123):');
  patients.forEach((pat) => {
    console.log(`  - ${pat.name}: ${pat.email}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
