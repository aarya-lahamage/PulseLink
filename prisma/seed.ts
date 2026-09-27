import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Purging old records...");
  await prisma.emergencyTimelineEvent.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.emergencyRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.bloodInventory.deleteMany();
  await prisma.hospital.deleteMany();

  console.log("Seeding Blood Inventory...");
  const bloodInventories = [
    { bloodGroup: "O+", unitsAvailable: 16 },
    { bloodGroup: "O-", unitsAvailable: 4 },
    { bloodGroup: "A+", unitsAvailable: 22 },
    { bloodGroup: "A-", unitsAvailable: 7 },
    { bloodGroup: "B+", unitsAvailable: 14 },
    { bloodGroup: "B-", unitsAvailable: 5 },
    { bloodGroup: "AB+", unitsAvailable: 8 },
    { bloodGroup: "AB-", unitsAvailable: 2 },
  ];
  for (const b of bloodInventories) {
    await prisma.bloodInventory.create({ data: b });
  }

  console.log("Seeding Hospitals (demo/fictional locations)...");
  const hospitals = await Promise.all([
    prisma.hospital.create({
      data: {
        name: "Central Metro General Hospital",
        address: "1 Civic Center Plaza, Downtown District",
        latitude: 28.6139,
        longitude: 77.209,
        phone: "+1 (555) 100-2000",
        emergencyReady: true,
        totalBeds: 220,
        availableBeds: 34,
        departmentStatus: "Operational",
      },
    }),
    prisma.hospital.create({
      data: {
        name: "St. Xavier Trauma & Emergency Center",
        address: "88 Trauma Care Way, Sector 4",
        latitude: 28.6339,
        longitude: 77.2295,
        phone: "+1 (555) 100-2001",
        emergencyReady: true,
        totalBeds: 150,
        availableBeds: 12,
        departmentStatus: "Operational",
      },
    }),
    prisma.hospital.create({
      data: {
        name: "Northside Community Medical Center",
        address: "45 Northside Ave, University Quarter",
        latitude: 28.6489,
        longitude: 77.185,
        phone: "+1 (555) 100-2002",
        emergencyReady: true,
        totalBeds: 90,
        availableBeds: 21,
        departmentStatus: "Limited",
      },
    }),
    prisma.hospital.create({
      data: {
        name: "Riverside Specialty Hospital",
        address: "12 Riverside Boulevard, Industrial District",
        latitude: 28.585,
        longitude: 77.235,
        phone: "+1 (555) 100-2003",
        emergencyReady: true,
        totalBeds: 130,
        availableBeds: 40,
        departmentStatus: "Operational",
      },
    }),
    prisma.hospital.create({
      data: {
        name: "Eastgate Regional Health Institute",
        address: "300 Eastgate Road, Summit District",
        latitude: 28.605,
        longitude: 77.255,
        phone: "+1 (555) 100-2004",
        emergencyReady: false,
        totalBeds: 60,
        availableBeds: 0,
        departmentStatus: "Diverting",
      },
    }),
  ]);

  console.log("Seeding Doctors...");
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        name: "Dr. Sarah Jenkins",
        specialty: "Emergency Medicine",
        department: "Trauma & Emergency",
        phone: "+1 (555) 234-5671",
        email: "s.jenkins@pulselink.health",
        available: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Robert Chen",
        specialty: "Critical Care & Cardiology",
        department: "Intensive Care Unit",
        phone: "+1 (555) 234-5672",
        email: "r.chen@pulselink.health",
        available: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Priya Patel",
        specialty: "Trauma & Orthopedic Surgery",
        department: "Surgical Services",
        phone: "+1 (555) 234-5673",
        email: "p.patel@pulselink.health",
        available: true,
      },
    }),
    prisma.doctor.create({
      data: {
        name: "Dr. Michael Ross",
        specialty: "Internal Medicine & Diagnostics",
        department: "Outpatient Clinic",
        phone: "+1 (555) 234-5674",
        email: "m.ross@pulselink.health",
        available: false,
      },
    }),
  ]);

  console.log("Seeding Ambulances...");
  const ambulances = await Promise.all([
    prisma.ambulance.create({
      data: {
        vehicleNumber: "AMB-101",
        driverName: "Marcus Vance",
        contact: "+1 (555) 901-1101",
        status: "Available",
        baseLocation: "Central Emergency Station",
        latitude: 28.61,
        longitude: 77.205,
      },
    }),
    prisma.ambulance.create({
      data: {
        vehicleNumber: "AMB-102",
        driverName: "David Reynolds",
        contact: "+1 (555) 901-1102",
        status: "En Route",
        baseLocation: "North Sector Hub",
        latitude: 28.645,
        longitude: 77.19,
      },
    }),
    prisma.ambulance.create({
      data: {
        vehicleNumber: "AMB-103",
        driverName: "Elena Rostova",
        contact: "+1 (555) 901-1103",
        status: "Assigned",
        baseLocation: "East District Depot",
        latitude: 28.6,
        longitude: 77.25,
      },
    }),
    prisma.ambulance.create({
      data: {
        vehicleNumber: "AMB-104",
        driverName: "James O'Connor",
        contact: "+1 (555) 901-1104",
        status: "Available",
        baseLocation: "Rapid Response Unit West",
        latitude: 28.59,
        longitude: 77.175,
      },
    }),
    prisma.ambulance.create({
      data: {
        vehicleNumber: "AMB-105",
        driverName: "Sita Sharma",
        contact: "+1 (555) 901-1105",
        status: "Available",
        baseLocation: "South General Outpost",
        latitude: 28.57,
        longitude: 77.215,
      },
    }),
  ]);

  console.log("Seeding Patients...");
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        fullName: "Arthur Pendelton",
        age: 64,
        gender: "Male",
        phone: "+1 (555) 832-1920",
        bloodGroup: "O-",
        address: "742 Evergreen Terrace, Sector 4",
        emergencyContact: "Eleanor Pendelton (Spouse) +1 555-832-1921",
        medicalNotes: "History of hypertension. Penicillin allergy.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Sophia Martinez",
        age: 29,
        gender: "Female",
        phone: "+1 (555) 441-8932",
        bloodGroup: "A+",
        address: "128 Oakridge Boulevard, Apt 4B",
        emergencyContact: "Carlos Martinez (Brother) +1 555-441-8930",
        medicalNotes: "No known allergies. Asthma recorded.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Devon Washington",
        age: 42,
        gender: "Male",
        phone: "+1 (555) 602-3319",
        bloodGroup: "B+",
        address: "512 Maple Lane, Unit 12",
        emergencyContact: "Alicia Washington (Wife) +1 555-602-3318",
        medicalNotes: "Type 2 diabetic, insulin managed.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Clara Beauchamp",
        age: 51,
        gender: "Female",
        phone: "+1 (555) 789-0144",
        bloodGroup: "AB-",
        address: "88 Willow Creek Highway",
        emergencyContact: "Marc Beauchamp (Son) +1 555-789-0140",
        medicalNotes: "Sulfa drug allergy. Chronic migraines.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Lucas Thorne",
        age: 19,
        gender: "Male",
        phone: "+1 (555) 321-9988",
        bloodGroup: "O+",
        address: "University Quarter, Hall 3, Rm 102",
        emergencyContact: "Nancy Thorne (Mother) +1 555-321-9900",
        medicalNotes: "Latex allergy. Severe bee sting allergy (EpiPen carry).",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Hannah Becker",
        age: 38,
        gender: "Female",
        phone: "+1 (555) 918-2736",
        bloodGroup: "A-",
        address: "305 Pine Valley Road",
        emergencyContact: "Kurt Becker (Spouse) +1 555-918-2730",
        medicalNotes: "No chronic conditions reported.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Vikram Malhotra",
        age: 58,
        gender: "Male",
        phone: "+1 (555) 554-6102",
        bloodGroup: "B-",
        address: "940 Summit Drive",
        emergencyContact: "Rina Malhotra (Daughter) +1 555-554-6100",
        medicalNotes: "Coronary stent placed 2023. Aspirin therapy.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Zoe Katsaros",
        age: 33,
        gender: "Female",
        phone: "+1 (555) 672-8811",
        bloodGroup: "O+",
        address: "14 Harbor View Walk",
        emergencyContact: "Nikos Katsaros (Father) +1 555-672-8800",
        medicalNotes: "Previous cesarean delivery. No known drug allergies.",
      },
    }),
    prisma.patient.create({
      data: {
        fullName: "Ethan Gallagher",
        age: 71,
        gender: "Male",
        phone: "+1 (555) 203-9118",
        bloodGroup: "A+",
        address: "60 Sunrise Senior Living Community",
        emergencyContact: "Brenda Gallagher (Daughter) +1 555-203-9110",
        medicalNotes: "Pacemaker recipient. Mild cognitive impairment.",
      },
    }),
  ]);

  const todayStr = new Date().toISOString().split("T")[0];

  console.log("Seeding Appointments...");
  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: patients[1].id, // Sophia Martinez
        doctorId: doctors[0].id,   // Dr. Sarah Jenkins
        date: todayStr,
        time: "10:30 AM",
        reason: "Post-discharge respiratory follow-up",
        status: "Confirmed",
        notes: "Check oxygen saturation and prescription renewal.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id, // Devon Washington
        doctorId: doctors[1].id,   // Dr. Robert Chen
        date: todayStr,
        time: "02:00 PM",
        reason: "Routine cardiovascular and glycemic checkup",
        status: "Confirmed",
        notes: "Review continuous glucose monitoring logs.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[5].id, // Hannah Becker
        doctorId: doctors[2].id,   // Dr. Priya Patel
        date: todayStr,
        time: "04:15 PM",
        reason: "Post-operative orthopedic assessment",
        status: "Pending",
        notes: "Awaiting staff schedule confirmation.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[7].id, // Zoe Katsaros
        doctorId: doctors[3].id,   // Dr. Michael Ross
        date: todayStr,
        time: "11:00 AM",
        reason: "Pre-employment medical clearance",
        status: "Pending",
        notes: "Pending clinic lab coordinator sign-off.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[8].id, // Ethan Gallagher
        doctorId: doctors[1].id,   // Dr. Robert Chen
        date: "2026-09-28",
        time: "09:00 AM",
        reason: "Biannual pacemaker interrogation",
        status: "Confirmed",
        notes: "Routine telemetry check.",
      },
    }),
  ]);

  console.log("Seeding Emergencies and Blood Requests...");

  // Emergency 1: High Priority - NEW (Needs Ambulance immediately, requires O- Blood)
  const emg1 = await prisma.emergencyRequest.create({
    data: {
      patientId: patients[0].id, // Arthur Pendelton (O-)
      emergencyType: "Acute Coronary Syndrome / Chest Pain",
      location: "Sector 4 Main Market, Near Grand Metro Station Gate 2",
      latitude: 28.62,
      longitude: 77.215,
      hospitalId: hospitals[1].id, // St. Xavier Trauma & Emergency Center
      priority: "HIGH",
      ambulanceRequired: true,
      bloodRequired: true,
      status: "NEW",
      notes: "Severe crushing retrosternal pain radiating to left arm. Immediate dispatch needed.",
      createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 mins ago
      timelineEvents: {
        create: [
          {
            stage: "CREATED",
            title: "Emergency Call Logged",
            description: "Caller reported acute chest distress and collapse. Triage code red generated.",
            timestamp: new Date(Date.now() - 12 * 60 * 1000),
          },
          {
            stage: "PRIORITY_IDENTIFIED",
            title: "Priority Set to HIGH",
            description: "Paramedic triage determined cardiac emergency. Marked HIGH priority. Ambulance requested.",
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Create associated Blood Request for Emergency 1
  await prisma.bloodRequest.create({
    data: {
      patientId: patients[0].id,
      emergencyId: emg1.id,
      bloodGroup: "O-",
      unitsRequired: 2,
      urgency: "Critical",
      status: "Pending",
      notes: "Emergency standby for Arthur Pendelton - cardiac intervention protocol.",
      createdAt: new Date(Date.now() - 9 * 60 * 1000),
    },
  });

  // Emergency 2: High Priority - IN_PROGRESS (Ambulance En Route)
  const emg2 = await prisma.emergencyRequest.create({
    data: {
      patientId: patients[4].id, // Lucas Thorne
      emergencyType: "Severe Anaphylaxis / Respiratory Obstruction",
      location: "University Sports Arena, West Concourse",
      latitude: 28.65,
      longitude: 77.195,
      hospitalId: hospitals[2].id, // Northside Community Medical Center
      priority: "HIGH",
      ambulanceRequired: true,
      bloodRequired: false,
      status: "IN_PROGRESS",
      ambulanceId: ambulances[1].id, // AMB-102 (En Route)
      notes: "Accidental allergen exposure during collegiate tournament. Epinephrine administered on site.",
      createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
      timelineEvents: {
        create: [
          {
            stage: "CREATED",
            title: "Emergency Call Logged",
            description: "University trainer reported severe airway constriction.",
            timestamp: new Date(Date.now() - 35 * 60 * 1000),
          },
          {
            stage: "PRIORITY_IDENTIFIED",
            title: "Priority Set to HIGH",
            description: "High priority classified due to compromised airway.",
            timestamp: new Date(Date.now() - 33 * 60 * 1000),
          },
          {
            stage: "AMBULANCE_ASSIGNED",
            title: "Ambulance Assigned",
            description: "Unit AMB-102 (Driver: David Reynolds) assigned to case.",
            timestamp: new Date(Date.now() - 28 * 60 * 1000),
          },
          {
            stage: "EN_ROUTE",
            title: "Ambulance En Route",
            description: "AMB-102 departed North Sector Hub with sirens active. ETA 6 minutes.",
            timestamp: new Date(Date.now() - 20 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Emergency 3: Medium Priority - ASSIGNED (Ambulance Assigned)
  const emg3 = await prisma.emergencyRequest.create({
    data: {
      patientId: patients[6].id, // Vikram Malhotra
      emergencyType: "Post-Operative Syncope / Dizziness",
      location: "940 Summit Drive, Residence Floor 3",
      latitude: 28.595,
      longitude: 77.245,
      hospitalId: hospitals[3].id, // Riverside Specialty Hospital
      priority: "MEDIUM",
      ambulanceRequired: true,
      bloodRequired: false,
      status: "ASSIGNED",
      ambulanceId: ambulances[2].id, // AMB-103 (Assigned)
      notes: "Transient loss of consciousness, stable vitals. Precautionary transport requested.",
      createdAt: new Date(Date.now() - 55 * 60 * 1000),
      timelineEvents: {
        create: [
          {
            stage: "CREATED",
            title: "Emergency Call Logged",
            description: "Daughter called clinic reporting fall and dizziness.",
            timestamp: new Date(Date.now() - 55 * 60 * 1000),
          },
          {
            stage: "PRIORITY_IDENTIFIED",
            title: "Priority Set to MEDIUM",
            description: "Vitals stable, patient conscious. Priority graded MEDIUM.",
            timestamp: new Date(Date.now() - 50 * 60 * 1000),
          },
          {
            stage: "AMBULANCE_ASSIGNED",
            title: "Ambulance Assigned",
            description: "Unit AMB-103 (Driver: Elena Rostova) assigned from East District Depot.",
            timestamp: new Date(Date.now() - 40 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Emergency 4: Low Priority - RESOLVED
  const emg4 = await prisma.emergencyRequest.create({
    data: {
      patientId: patients[3].id, // Clara Beauchamp
      emergencyType: "Minor Chemical Splash / Eye Irrigation",
      location: "Industrial District Plant 5",
      latitude: 28.58,
      longitude: 77.23,
      hospitalId: hospitals[3].id, // Riverside Specialty Hospital
      priority: "LOW",
      ambulanceRequired: false,
      bloodRequired: false,
      status: "RESOLVED",
      resolvedAt: new Date(Date.now() - 120 * 60 * 1000),
      notes: "Station eyewash utilized. Minor corneal irritation assessed and cleared.",
      createdAt: new Date(Date.now() - 180 * 60 * 1000),
      timelineEvents: {
        create: [
          {
            stage: "CREATED",
            title: "Emergency Call Logged",
            description: "Workplace supervisor reported splash incident.",
            timestamp: new Date(Date.now() - 180 * 60 * 1000),
          },
          {
            stage: "PRIORITY_IDENTIFIED",
            title: "Priority Set to LOW",
            description: "Non-corrosive saline-neutralized solution confirmed. Classified LOW.",
            timestamp: new Date(Date.now() - 170 * 60 * 1000),
          },
          {
            stage: "RESOLVED",
            title: "Emergency Case Resolved",
            description: "Patient assessed by on-site nursing staff. Discharge instructions given.",
            timestamp: new Date(Date.now() - 120 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Standalone Blood Request (e.g. for surgery scheduled)
  await prisma.bloodRequest.create({
    data: {
      patientId: patients[3].id, // Clara Beauchamp (AB-)
      bloodGroup: "AB-",
      unitsRequired: 1,
      urgency: "Urgent",
      status: "Matching",
      notes: "Scheduled elective arthroscopy pre-transfusion reservation.",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await prisma.bloodRequest.create({
    data: {
      patientId: patients[2].id, // Devon Washington (B+)
      bloodGroup: "B+",
      unitsRequired: 3,
      urgency: "Normal",
      status: "Fulfilled",
      notes: "Routine inventory allocation for surgical replacement completed.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  });

  console.log("Database seeded successfully with realistic data!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
