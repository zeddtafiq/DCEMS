// Shared seed data + storage keys so every page and the dashboard read
// from the same source of truth.

export const KEYS = {
  projects: "dcems.projects",
  equipment: "dcems.equipment",
  materials: "dcems.materials",
  drawings: "dcems.drawings",
  inspections: "dcems.inspections",
  testing: "dcems.testing",
  commissioning: "dcems.commissioning",
  reports: "dcems.reports",
  documents: "dcems.documents",
} as const;

export const projectsSeed = [
  { name: "Riyadh Data Center Phase 2", client: "STC", manager: "Ahmed Al-Farsi", team: 24, due: "2026-11-30", progress: 78, status: "On Track" },
  { name: "Jeddah Hospital MEP", client: "MOH", manager: "Sara Khan", team: 18, due: "2026-09-15", progress: 62, status: "On Track" },
  { name: "NEOM Substation A1", client: "NEOM", manager: "Omar Nasser", team: 32, due: "2027-02-01", progress: 41, status: "Delayed" },
  { name: "Dammam Refinery Upgrade", client: "Aramco", manager: "Layla Hassan", team: 27, due: "2026-08-20", progress: 88, status: "On Track" },
  { name: "Airport Terminal 5 Power", client: "GACA", manager: "Ibrahim Yusuf", team: 21, due: "2026-12-10", progress: 55, status: "At Risk" },
  { name: "Metro Line 3 Traction", client: "RCRC", manager: "Fatima Ali", team: 19, due: "2027-04-01", progress: 30, status: "On Track" },
];

export const equipmentSeed = [
  { tag: "TR-01", name: "Transformer 2500 kVA", vendor: "ABB", location: "Substation A", status: "Commissioned", installed: "2026-05-12" },
  { tag: "TR-02", name: "Transformer 1600 kVA", vendor: "Siemens", location: "Substation B", status: "Testing", installed: "2026-06-01" },
  { tag: "RMU-01", name: "Ring Main Unit 24kV", vendor: "Schneider", location: "Utility Room", status: "Testing", installed: "2026-06-08" },
  { tag: "RMU-02", name: "Ring Main Unit 24kV", vendor: "Schneider", location: "Utility Room 2", status: "Installed", installed: "2026-06-15" },
  { tag: "MV-P1", name: "MV Panel 11kV", vendor: "ABB", location: "MV Room", status: "Commissioned", installed: "2026-04-20" },
  { tag: "LV-P1", name: "LV Panel 400V", vendor: "Schneider", location: "Electrical Room", status: "Installed", installed: "2026-06-22" },
  { tag: "UPS-A", name: "UPS 300 kVA", vendor: "Eaton", location: "UPS Room", status: "Delivered", installed: "-" },
  { tag: "BD-01", name: "Busduct 2500A", vendor: "GE", location: "Riser Shaft", status: "Testing", installed: "2026-06-05" },
  { tag: "GEN-01", name: "Generator 1500 kVA", vendor: "Cummins", location: "Gen Yard", status: "Faulty", installed: "2026-05-30" },
];

export const materialsSeed = [
  { code: "CBL-4C-240", name: "4C x 240mm² XLPE Cable", unit: "m", ordered: 8000, delivered: 6200, used: 4800 },
  { code: "CBL-1C-500", name: "1C x 500mm² Cable", unit: "m", ordered: 2400, delivered: 2400, used: 2100 },
  { code: "TRAY-600", name: "Cable Tray 600mm", unit: "m", ordered: 1200, delivered: 900, used: 700 },
  { code: "COND-32", name: "GI Conduit 32mm", unit: "m", ordered: 5000, delivered: 5000, used: 3200 },
  { code: "MCB-C63", name: "MCB C-Curve 63A", unit: "pcs", ordered: 240, delivered: 240, used: 180 },
  { code: "LT-LED-40", name: "LED Fixture 40W", unit: "pcs", ordered: 620, delivered: 500, used: 340 },
  { code: "EARTH-25", name: "Earth Conductor 25mm²", unit: "m", ordered: 3000, delivered: 2200, used: 1400 },
];

export const drawingsSeed = [
  { no: "E-101", title: "MV Single Line Diagram", rev: "R3", discipline: "Electrical", status: "Approved", date: "2026-06-15" },
  { no: "E-102", title: "LV Distribution Layout", rev: "R2", discipline: "Electrical", status: "Approved", date: "2026-06-10" },
  { no: "E-201", title: "Cable Routing Ground Floor", rev: "R4", discipline: "Electrical", status: "For Review", date: "2026-07-01" },
  { no: "E-202", title: "Cable Routing L1-L3", rev: "R2", discipline: "Electrical", status: "Approved", date: "2026-06-22" },
  { no: "E-301", title: "Lighting Layout", rev: "R1", discipline: "Electrical", status: "IFC", date: "2026-06-28" },
  { no: "E-401", title: "Earthing & Lightning Protection", rev: "R2", discipline: "Electrical", status: "For Review", date: "2026-07-05" },
  { no: "E-501", title: "Fire Alarm Schematic", rev: "R1", discipline: "ELV", status: "Approved", date: "2026-06-18" },
];

export const inspectionsSeed = [
  { id: "INS-1042", equipment: "Transformer TR-01", type: "Pre-Energization", inspector: "M. Karim", date: "2026-07-01", result: "Passed" },
  { id: "INS-1043", equipment: "RMU-01", type: "Visual", inspector: "A. Rahman", date: "2026-07-02", result: "Passed" },
  { id: "INS-1044", equipment: "LV Panel-01", type: "IR Test", inspector: "S. Yousef", date: "2026-07-03", result: "Failed" },
  { id: "INS-1045", equipment: "Busduct BD-01", type: "Torque Check", inspector: "H. Nabil", date: "2026-07-04", result: "Passed" },
  { id: "INS-1046", equipment: "UPS-A", type: "Installation", inspector: "M. Karim", date: "2026-07-05", result: "Pending" },
  { id: "INS-1047", equipment: "GEN-01", type: "Fuel & Cooling", inspector: "A. Rahman", date: "2026-07-05", result: "Failed" },
  { id: "INS-1048", equipment: "MV Panel-01", type: "Interlock Check", inspector: "S. Yousef", date: "2026-07-06", result: "Passed" },
];

export const testingSeed = [
  { id: "T-2001", equipment: "TR-01", test: "Insulation Resistance", value: "> 1000 MΩ", limit: "≥ 500 MΩ", result: "Pass" },
  { id: "T-2002", equipment: "TR-01", test: "Turns Ratio (TTR)", value: "1.002", limit: "±0.5%", result: "Pass" },
  { id: "T-2003", equipment: "RMU-01", test: "Contact Resistance", value: "38 µΩ", limit: "< 50 µΩ", result: "Pass" },
  { id: "T-2004", equipment: "LV-P1", test: "IR Test (500V DC)", value: "180 MΩ", limit: "≥ 200 MΩ", result: "Fail" },
  { id: "T-2005", equipment: "BD-01", test: "Hi-Pot 2.5 kV", value: "OK", limit: "No breakdown", result: "Pass" },
  { id: "T-2006", equipment: "GEN-01", test: "Load Bank 100%", value: "1495 kW", limit: "≥ 1500 kW", result: "Retest" },
  { id: "T-2007", equipment: "UPS-A", test: "Battery Discharge", value: "12 min", limit: "≥ 10 min", result: "Pass" },
];

export const commissioningSeed = [
  { name: "MV Switchgear", pct: 95, stage: "Energized" },
  { name: "Transformers", pct: 88, stage: "Live Trials" },
  { name: "LV Distribution", pct: 72, stage: "Energization" },
  { name: "UPS Systems", pct: 60, stage: "SAT" },
  { name: "Generators", pct: 45, stage: "Load Bank" },
  { name: "Busduct", pct: 78, stage: "Testing Complete" },
  { name: "Lighting", pct: 82, stage: "Live Trials" },
  { name: "Fire Alarm", pct: 55, stage: "Integration" },
  { name: "Earthing / LPS", pct: 92, stage: "Handed Over" },
];

export const reportsSeed = [
  { id: "RPT-081", title: "Daily Site Report — 08 Jul", author: "Site Engineer", type: "Daily", date: "2026-07-08" },
  { id: "RPT-080", title: "Weekly Progress — Week 27", author: "PM Office", type: "Weekly", date: "2026-07-07" },
  { id: "RPT-079", title: "Monthly Executive Report — June", author: "PM Office", type: "Monthly", date: "2026-07-01" },
  { id: "RPT-078", title: "Commissioning Milestone MV", author: "QA/QC", type: "Milestone", date: "2026-06-28" },
  { id: "RPT-077", title: "NCR Summary — June", author: "QA/QC", type: "QA", date: "2026-06-30" },
];

export const documentsSeed = [
  { name: "MS-EL-014 Cable Pulling.pdf", folder: "Method Statements", size: "1.8 MB", by: "S. Yousef", date: "2026-07-04", tag: "Approved" },
  { name: "ITP-EL-05 MV Panel.xlsx", folder: "ITP & QCP", size: "220 KB", by: "QA/QC", date: "2026-07-03", tag: "Live" },
  { name: "TR-01 Test Report.pdf", folder: "As-Built", size: "3.4 MB", by: "M. Karim", date: "2026-07-02", tag: "Final" },
  { name: "Site Photos — MV Room.zip", folder: "Photos", size: "42 MB", by: "Site Team", date: "2026-07-01", tag: "New" },
  { name: "UPS O&M Manual.pdf", folder: "O&M Manuals", size: "5.6 MB", by: "Vendor", date: "2026-06-28", tag: "Reference" },
  { name: "Subcontract Package B.pdf", folder: "Contracts", size: "2.1 MB", by: "Commercial", date: "2026-06-25", tag: "Confidential" },
];
