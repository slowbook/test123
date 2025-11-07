// Quick test script to check appointment roomIds in database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAppointments() {
  console.log('🔍 Checking all appointments in database...\n');
  
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { select: { name: true, email: true } },
    },
  });

  if (appointments.length === 0) {
    console.log('❌ No appointments found! You need to create an appointment first.');
    return;
  }

  console.log(`✅ Found ${appointments.length} appointment(s):\n`);

  appointments.forEach((apt, index) => {
    console.log(`[${index + 1}] Appointment ID: ${apt.id}`);
    console.log(`    Room ID: ${apt.roomId}`);
    console.log(`    Room ID Type: ${typeof apt.roomId}`);
    console.log(`    Room ID Length: ${apt.roomId?.length}`);
    console.log(`    Patient: ${apt.patient.name} (${apt.patient.email})`);
    console.log(`    Doctor: ${apt.doctor.name} (${apt.doctor.email})`);
    console.log(`    Status: ${apt.status}`);
    console.log(`    Scheduled: ${apt.scheduledAt}`);
    console.log('');
  });

  console.log('\n💡 To join consultation, use the Room ID shown above');
  console.log('   Navigate to: /consultation/<Room ID>');
}

checkAppointments()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
