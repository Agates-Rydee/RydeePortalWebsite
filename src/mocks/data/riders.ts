// Seed data for MSW handlers (ADR-0003). Moved from src/app/data/mockData.ts
// in Checkpoint 4. Byte-for-byte content preserved.
import type { ActiveRider, PendingRider } from "@/types/rider";

export const INITIAL_ACTIVE_RIDERS: ActiveRider[] = [
  { id: 1,  name: "Usman Tariq",      lat: 24.8607, lng: 67.0011, state: "idle",        bike: "Jolta E70",    area: "Saddar"          },
  { id: 2,  name: "Bilal Hussain",    lat: 24.8157, lng: 67.0235, state: "dispatching", bike: "Vlot Eagle",   area: "Clifton"         },
  { id: 3,  name: "Zain ul Abidin",   lat: 24.9215, lng: 67.0897, state: "arriving",    bike: "Jolta E70",    area: "Gulshan-e-Iqbal" },
  { id: 4,  name: "Haris Baig",       lat: 24.8700, lng: 67.0500, state: "idle",        bike: "Rydee R1",     area: "PECHS"           },
  { id: 5,  name: "Asim Raza",        lat: 24.9500, lng: 67.0200, state: "dispatching", bike: "Vlot Eagle",   area: "North Nazimabad" },
  { id: 6,  name: "Faisal Mehmood",   lat: 24.8100, lng: 67.0300, state: "idle",        bike: "Jolta E70",    area: "DHA Phase 6"     },
  { id: 7,  name: "Talha Sheikh",     lat: 24.8900, lng: 67.2000, state: "arriving",    bike: "Rydee R1",     area: "Malir"           },
  { id: 8,  name: "Kamran Siddiqui",  lat: 24.8200, lng: 67.1300, state: "dispatching", bike: "Vlot Eagle",   area: "Korangi"         },
  { id: 9,  name: "Saad Farooq",      lat: 24.9400, lng: 66.9900, state: "idle",        bike: "Jolta E70",    area: "Orangi Town"     },
  { id: 10, name: "Hamid Qureshi",    lat: 24.8500, lng: 67.1900, state: "arriving",    bike: "Rydee R1",     area: "Landhi"          },
  { id: 11, name: "Waqar Ahmed",      lat: 24.8600, lng: 66.9900, state: "dispatching", bike: "Vlot Eagle",   area: "Lyari"           },
  { id: 12, name: "Omer Javed",       lat: 24.9000, lng: 67.1100, state: "idle",        bike: "Jolta E70",    area: "Gulistan-e-Johar"},
];

export const PENDING_RIDERS: PendingRider[] = [
  { id: 1, name: "Muhammad Imran",   phone: "0312-4561234", dob: "1998-06-14", cnic: "42101-7654321-3", area: "", documents: ["CNIC Copy", "Profile Photo"], pin: "" },
  { id: 2, name: "Naveed Akhtar",    phone: "0321-9876543", dob: "1995-11-02", cnic: "42201-1234567-1", area: "", documents: ["CNIC Copy"],                   pin: "" },
  { id: 3, name: "Shoaib Malik",     phone: "0333-1122334", dob: "2000-03-25", cnic: "42301-9988776-5", area: "", documents: ["CNIC Copy", "Profile Photo", "Bike Registration"], pin: "" },
  { id: 4, name: "Rizwan Ghafoor",   phone: "0345-5544332", dob: "1993-08-19", cnic: "42101-4433221-7", area: "", documents: [],                              pin: "" },
  { id: 5, name: "Danish Mehmood",   phone: "0300-7654321", dob: "1997-01-30", cnic: "42401-6677889-2", area: "", documents: ["CNIC Copy", "Bike Registration"], pin: "" },
  { id: 6, name: "Kashif Noor",      phone: "0311-2233445", dob: "2001-09-07", cnic: "42501-1122334-9", area: "", documents: ["Profile Photo"],               pin: "" },
  { id: 7, name: "Sajid Iqbal",      phone: "0322-8877665", dob: "1996-12-20", cnic: "42601-5566778-4", area: "", documents: ["CNIC Copy", "Profile Photo", "Driving License"], pin: "" },
  { id: 8, name: "Adnan Rasheed",    phone: "0343-3344556", dob: "1999-05-11", cnic: "42101-2233445-6", area: "", documents: [],                              pin: "" },
];

export const KARACHI_AREAS = [
  "Clifton", "DHA Phase 1", "DHA Phase 6", "Gulshan-e-Iqbal", "PECHS",
  "Saddar", "North Nazimabad", "Malir", "Korangi", "Orangi Town",
  "Landhi", "Lyari", "Gulistan-e-Johar", "Federal B Area", "Bahadurabad",
];

export const VERIFICATION_DOCS = [
  "CNIC Copy",
  "Profile Photo",
  "Bike Registration",
  "Driving License",
  "Utility Bill",
];
