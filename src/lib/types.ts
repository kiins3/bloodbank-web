// Types for the BloodBankManager API. Most controllers return untyped
// ResponseEntity<?>, so these mirror real responses captured from the API.

export type Role = "ADMIN" | "STAFF_TECH" | "STAFF_INVENTORY" | "DONOR" | "HOSPITAL";
export type UserStatus = "ACTIVE" | "INACTIVE" | "KHACH_VANG_LAI";
export type Position = "BAC_SI" | "Y_TA" | "KY_THUAT" | "QUAN_LY_KHO" | "ADMIN";
export type EventStatus = "SAP_TOI" | "DANG_MO" | "DA_DONG" | "DA_HUY";
export type RegistrationStatus =
  | "DA_DANG_KY" | "DA_HET_HAN" | "DA_HUY" | "CHO_KHAM" | "DONG_Y"
  | "TU_CHOI" | "DA_LAY_MAU" | "THAT_BAI" | "HOAN_THANH";
export type ProductType = "MAU_TOAN_PHAN" | "TUI_HONG_CAU" | "TUI_TIEU_CAU" | "TUI_HUYET_TUONG";
export type BloodBagStatus =
  | "CHO_XET_NGHIEM" | "CHO_TACH_CHIET" | "CHO_HUY" | "DA_HUY" | "CHO_IN_NHAN" | "CHO_BAO_QUAN"
  | "DA_TACH_CHIET" | "SAN_SANG" | "DA_XUAT" | "DA_DUOC_SU_DUNG" | "HOAN_TRA" | "CHO_KIEM_DINH";
export type BloodRequestStatus =
  | "CHO_DUYET" | "DA_HUY" | "DA_DUYET_TOAN_BO" | "DA_DUYET_MOT_PHAN" | "DA_TU_CHOI"
  | "DANG_VAN_CHUYEN" | "HOAN_TRA_MOT_PHAN" | "HOAN_TRA_TOAN_BO" | "DA_NHAN" | "DA_NHAN_MOT_PHAN";
export type Priority = "BINH_THUONG" | "KHAN_CAP";
export type EquipmentStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type AssignmentRole = "TIEP_DON" | "KHAM_SANG_LOC" | "LAY_MAU";
export type TestValue = "AM_TINH" | "DUONG_TINH" | "CHUA_CO";

export type Page<T> = {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
};

// ---- Events ----
export type EventSummary = {
  eventId: number;
  eventName: string;
  location: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  currentAmount: number;
  status: EventStatus;
};

export type EventDetail = Omit<EventSummary, "currentAmount"> & {
  registeredCount: number;
  actualCount: number;
};

export type EventAssignmentList = {
  eventId: number;
  eventName: string;
  assignedStaff: { staffId: number; fullName: string; position: Position; role?: AssignmentRole }[];
};

export type SmartStaff = { staffId: number; fullName: string; position: Position; available: boolean };

// ---- People ----
export type StaffSummary = {
  staffId: number;
  fullName: string;
  phone: string;
  email: string;
  position: Position;
  status: UserStatus;
};

export type StaffDetail = StaffSummary & {
  address: string | null;
  gender: string | null;
  dob: string | null;
  cccd?: string;
};

export type StaffAssignmentHistory = {
  eventId: number;
  eventName: string;
  startDate: string;
  location: string;
  role: AssignmentRole;
  assignmentStatus: UserStatus;
};

export type Hospital = {
  hospitalId: number;
  hospitalName: string;
  address: string;
  hotline: string;
  email: string;
  status: UserStatus;
};

export type DonorSummary = {
  donorId: number;
  fullName: string;
  phone: string;
  email: string;
  bloodType: string | null;
  rhFactor: string | null;
  userStatus: UserStatus;
  totalDonations: number;
  lastDonationDate: string | null;
};

export type DonorDetail = DonorSummary & {
  dob: string | null;
  gender: string | null;
  address: string | null;
  hasUnsafeTest: boolean;
  displayStatus: string;
};

export type DonationHistoryItem = {
  registrationId: number;
  donationDate: string;
  location: string;
  volumeMl: number;
  status: RegistrationStatus;
  eventName: string;
};

// ---- Profiles (GET /api/shared/user/get-profile, shape depends on role) ----
export type DonorProfile = {
  email: string;
  fullName: string | null;
  cccd: string;
  gender: string | null;
  dob: string | null;
  bloodType: string | null;
  rhFactor: string | null;
  phone: string;
  address: string | null;
  status: UserStatus;
};
export type HospitalProfile = { hospitalId: number; email: string; hospitalName: string; hotline: string; address: string };
export type StaffProfile = StaffDetail;

// ---- Inventory ----
export type Equipment = {
  equipmentId: number;
  name: string;
  productType: ProductType;
  standard: string | null;
  maxCapacity: number;
  currentLoad: number;
  status: EquipmentStatus;
};

export type BloodBagSummary = {
  bloodBagId: number;
  collectedAt: string;
  bloodType: string | null;
  rhFactor: string | null;
  bloodFactor: string | null;
  productType: ProductType;
  storageLocation: string;
  status: BloodBagStatus;
};

// ---- Blood requests ----
export type RequestItem = {
  detailId: number;
  bloodType: string;
  productType: ProductType;
  volume: number;
  quantity: number;
  approvedQuantity: number | null;
  deadline: string | null;
};

export type BloodRequestSummary = {
  requestId: number;
  hospitalName: string;
  priority: Priority;
  deadlineDate: string;
  requestedDate: string;
  status: BloodRequestStatus;
  hospitalId: number | null;
  detailRequests: RequestItem[];
};

export type HospitalRequestHistory = {
  requestId: number;
  priority: Priority;
  deadlineDate: string;
  requestedDate: string;
  status: BloodRequestStatus;
  totalQuantity: number;
};

export type ExportedBag = {
  bloodBagId: number;
  bloodType: string;
  rhFactor: string;
  productType: ProductType;
  volume: number;
  expiredAt: string;
  storageLocation: string;
  status: BloodBagStatus;
  returnReasonNote: string | null;
};

export type BloodRequestDetail = Omit<BloodRequestSummary, "detailRequests"> & {
  requestedItems: RequestItem[];
  exportDate: string | null;
  exportedBy: string | null;
  exportedBags: ExportedBag[] | null;
};

// ---- Logs ----
export type ActionLog = {
  logId: number;
  staffId: number | null;
  staffName: string | null;
  performedByUserId: number;
  performedByRole: Role;
  actionType: string;
  entityName: string;
  entityId: string;
  oldData: string | null;
  newData: string | null;
  note: string | null;
  status: string;
  createdAt: string;
};

// ---- Admin stats ----
export type GeneralStat = { totalBloodBag: number; totalEvent: number; totalRequest: number; totalExpiringBloodBag: number };
export type DonorStat = { totalDonor: number; activeDonor: number; donatedThisMonth: number };
export type EventCountStat = { upcomingEvent: number; ongoingEvent: number; completedEvent: number };
export type EventPerformance = { events: { eventId: number; eventName: string; registeredCount: number; actualCount: number }[] };
export type HospitalStat = { totalHospital: number; activeHospital: number; totalRequest: number; approvedRequest: number };
export type StaffStat = { totalStaff: number; techStaff: number; inventoryStaff: number; activeStaff: number };
export type EquipmentStat = { totalEquipment: number; activeEquipment: number; nearlyFullEquipment: number; maintenanceEquipment: number };
export type BloodTypeStat = { bloodType: string; rhFactor: string; total: number };
export type BloodInventoryStat = { totalBloodBag: number; pendingTestBloodBag: number; expiringBloodBag: number; expiredBloodBag: number };

// ---- Hospital portal
export type HospitalDashboard = { pendingApprovalCount: number; inTransitCount: number; recentRequests: BloodRequestSummary[] };
export type RejectedBag = { bloodBagId: number; reason: string };

// ---- Donor portal
export type DonorHealthRecord = { bloodType: string | null; rhFactor: string | null; totalDonation: number; totalVolumeMl: number };
export type DonorHistory = { history: DonationHistoryItem[] };
export type TicketSummary = {
  registrationId: number;
  eventId: number;
  eventName: string;
  startDate: string;
  status: EventStatus;
  registrationStatus: RegistrationStatus;
};
export type Ticket = {
  eventName: string;
  ticketCode: string;
  qrCode: string;
  location: string;
  startDate: string;
  endDate: string;
  donorName: string;
  status: RegistrationStatus;
};
export type DonationDetail = {
  registrationId: number;
  eventName: string;
  donationDate: string;
  location: string;
  expectedVolume: number | null;
  actualVolume: number | null;
  status: RegistrationStatus;
  rejectionReason: string | null;
  screeningInfo: { weight: number; hemoglobin: number; bloodPressure: string; heartRate: number } | null;
  testResultInfo: {
    hiv: TestValue; hbv: TestValue; hcv: TestValue; syphilis: TestValue; malaria: TestValue;
    finalConclusion: string | null;
    resultDate: string | null;
  } | null;
};

// ---- Staff portal
export type StaffGeneralStat = {
  pendingTestBloodBag: number;
  pendingStorageBloodBag: number;
  pendingRequest: number;
  expiringBloodBag: number;
  expiredBloodBag: number;
};
export type MyAssignment = {
  eventId: number;
  eventName: string;
  startDate: string;
  endDate: string;
  location: string;
  eventStatus: EventStatus;
  role: AssignmentRole;
  registeredCount: number;
  actualCount: number;
};
export type EventDonor = {
  regisId: number;
  donorId: number;
  ticketCode: string;
  fullName: string;
  gender: string | null;
  dob: string | null;
  phone: string;
  address: string | null;
  status: RegistrationStatus;
};
export type SuggestedBag = {
  bloodBagId: number;
  productType: ProductType;
  bloodType: string;
  rhFactor: string;
  volume: number;
  expiryDate: string;
  bagCode: string;
  storageLocation: string;
  suggested: boolean;
};
export type PrintedLabel = {
  bagCode: string;
  barCodeBag: string;
  bloodType: string;
  rhFactor: string;
  productType: ProductType;
  expiryDate: string;
  volume: number;
};
export type ReturnAction = "DANG_CHO" | "TIEU_HUY" | "KIEM_DINH";
export type ReturnLogItem = {
  logId: number;
  bloodBagId: number;
  productType: ProductType;
  bloodType: string;
  bagCode: string;
  hospitalName: string;
  reason: string | null;
  actionTaken: ReturnAction | null;
  staffName: string | null;
  createdAt: string;
  currentBagStatus: BloodBagStatus;
};
export type ReturnOrder = {
  returnOrderId: number;
  hospitalName: string;
  createdAt: string;
  processedBy: string | null;
  totalCount: number;
  pendingCount: number;
  allProcessed: boolean;
  bags: {
    logId: number;
    bloodBagId: number;
    bagCode: string;
    bloodType: string;
    rhFactor: string;
    productType: ProductType;
    volume: number;
    expiredAt: string;
    currentStatus: BloodBagStatus;
    expired: boolean;
    actionTaken: ReturnAction | null;
    reason: string | null;
  }[];
};
export type BulkInspectResult = {
  summary: string;
  successCount: number;
  pendingHuyCount: number;
  pendingKiemDinhCount: number;
  errors: string[];
  allOrderProcessed: boolean;
};

export type BloodBagDetail = {
  donorName: string | null;
  collectedAt: string;
  expirationDate: string | null;
  bloodType: string | null;
  rhFactor: string | null;
  /** Nominal bag volume (250/350/450). */
  actualVolume: number | null;
  bagCode: string | null;
  barcodeBase64: string | null;
  hiv: TestValue | null;
  hbv: TestValue | null;
  hcv: TestValue | null;
  syphilis: TestValue | null;
  malaria: TestValue | null;
  finalConclusion: string | null;
  storageLocation: string;
  status: BloodBagStatus;
  productType: ProductType;
};
