import type { ActiveRider } from "@/types/rider";

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
