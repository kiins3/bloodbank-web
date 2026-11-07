import type {
  AssignmentRole, BloodBagStatus, BloodRequestStatus, EquipmentStatus, EventStatus,
  Position, Priority, ProductType, RegistrationStatus, Role, TestValue, UserStatus,
} from "./types";

export type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "violet";
type Label = { label: string; tone: Tone };

export const eventStatus: Record<EventStatus, Label> = {
  SAP_TOI: { label: "Sắp diễn ra", tone: "blue" },
  DANG_MO: { label: "Đang diễn ra", tone: "green" },
  DA_DONG: { label: "Đã kết thúc", tone: "neutral" },
  DA_HUY: { label: "Đã hủy", tone: "red" },
};

export const registrationStatus: Record<RegistrationStatus, Label> = {
  DA_DANG_KY: { label: "Đã đăng ký", tone: "blue" },
  DA_HET_HAN: { label: "Hết hạn", tone: "neutral" },
  DA_HUY: { label: "Đã hủy", tone: "neutral" },
  CHO_KHAM: { label: "Chờ khám", tone: "amber" },
  DONG_Y: { label: "Đủ điều kiện", tone: "violet" },
  TU_CHOI: { label: "Không đủ điều kiện", tone: "red" },
  DA_LAY_MAU: { label: "Đã lấy máu", tone: "green" },
  THAT_BAI: { label: "Lấy máu thất bại", tone: "red" },
  HOAN_THANH: { label: "Hoàn thành", tone: "green" },
};

export const bagStatus: Record<BloodBagStatus, Label> = {
  CHO_XET_NGHIEM: { label: "Chờ xét nghiệm", tone: "amber" },
  CHO_TACH_CHIET: { label: "Chờ tách chiết", tone: "amber" },
  CHO_HUY: { label: "Chờ hủy", tone: "red" },
  DA_HUY: { label: "Đã hủy", tone: "neutral" },
  CHO_IN_NHAN: { label: "Chờ in nhãn", tone: "violet" },
  CHO_BAO_QUAN: { label: "Chờ nhập kho", tone: "violet" },
  DA_TACH_CHIET: { label: "Đã tách chiết", tone: "neutral" },
  SAN_SANG: { label: "Sẵn sàng", tone: "green" },
  DA_XUAT: { label: "Đã xuất", tone: "blue" },
  DA_DUOC_SU_DUNG: { label: "Đã sử dụng", tone: "neutral" },
  HOAN_TRA: { label: "Hoàn trả", tone: "amber" },
  CHO_KIEM_DINH: { label: "Chờ kiểm định", tone: "amber" },
};

export const requestStatus: Record<BloodRequestStatus, Label> = {
  CHO_DUYET: { label: "Chờ duyệt", tone: "amber" },
  DA_HUY: { label: "Đã hủy", tone: "neutral" },
  DA_DUYET_TOAN_BO: { label: "Đã duyệt", tone: "violet" },
  DA_DUYET_MOT_PHAN: { label: "Duyệt một phần", tone: "violet" },
  DA_TU_CHOI: { label: "Từ chối", tone: "red" },
  DANG_VAN_CHUYEN: { label: "Đang vận chuyển", tone: "blue" },
  HOAN_TRA_MOT_PHAN: { label: "Hoàn trả một phần", tone: "amber" },
  HOAN_TRA_TOAN_BO: { label: "Hoàn trả", tone: "red" },
  DA_NHAN: { label: "Đã nhận", tone: "green" },
  DA_NHAN_MOT_PHAN: { label: "Nhận một phần", tone: "green" },
};

export const userStatus: Record<UserStatus, Label> = {
  ACTIVE: { label: "Hoạt động", tone: "green" },
  INACTIVE: { label: "Ngừng hoạt động", tone: "neutral" },
  KHACH_VANG_LAI: { label: "Khách vãng lai", tone: "blue" },
};

export const equipmentStatus: Record<EquipmentStatus, Label> = {
  ACTIVE: { label: "Hoạt động", tone: "green" },
  INACTIVE: { label: "Ngừng dùng", tone: "neutral" },
  MAINTENANCE: { label: "Bảo trì", tone: "amber" },
};

export const priority: Record<Priority, Label> = {
  BINH_THUONG: { label: "Bình thường", tone: "neutral" },
  KHAN_CAP: { label: "Khẩn cấp", tone: "red" },
};

export const productType: Record<ProductType, string> = {
  MAU_TOAN_PHAN: "Máu toàn phần",
  TUI_HONG_CAU: "Hồng cầu",
  TUI_HUYET_TUONG: "Huyết tương",
  TUI_TIEU_CAU: "Tiểu cầu",
};

export const position: Record<Position, string> = {
  BAC_SI: "Bác sĩ",
  Y_TA: "Y tá",
  KY_THUAT: "Kỹ thuật viên",
  QUAN_LY_KHO: "Quản lý kho",
  ADMIN: "Quản trị viên",
};

export const assignmentRole: Record<AssignmentRole, string> = {
  TIEP_DON: "Tiếp đón",
  KHAM_SANG_LOC: "Khám sàng lọc",
  LAY_MAU: "Lấy máu",
};

export const roleLabel: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  STAFF_TECH: "Nhân viên kỹ thuật",
  STAFF_INVENTORY: "Nhân viên kho",
  HOSPITAL: "Bệnh viện",
  DONOR: "Người hiến máu",
};

export const testValue: Record<TestValue, Label> = {
  AM_TINH: { label: "Âm tính", tone: "green" },
  DUONG_TINH: { label: "Dương tính", tone: "red" },
  CHUA_CO: { label: "Chưa có", tone: "neutral" },
};

export const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;

export function bloodGroup(type?: string | null, rh?: string | null) {
  if (!type) return "—";
  return `${type}${rh ?? ""}`;
}

/** Backend sends local date-times without a zone, e.g. "2026-11-07T08:37:47.37". */
function toDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(value?: string | null) {
  const d = toDate(value);
  return d ? d.toLocaleDateString("vi-VN") : "—";
}

export function fmtDateTime(value?: string | null) {
  const d = toDate(value);
  return d
    ? `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
    : "—";
}

export function fmtTime(value?: string | null) {
  const d = toDate(value);
  return d ? d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-11-12T08:00" (datetime-local input) -> "12-11-2026 08:00" (@JsonFormat on event DTOs). */
export function toApiDateTime(local: string) {
  const d = new Date(local);
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-11-12" (date input) -> "12-11-2026". */
export function toApiDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

/** Backend date-time -> value for a datetime-local input. */
export function toInputDateTime(value?: string | null) {
  const d = toDate(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
}

/** "A+", "A-", … "O-" for selects. */
export const BLOOD_GROUPS = BLOOD_TYPES.flatMap((t) => ["+", "-"].map((rh) => `${t}${rh}`));

/** Local date as "yyyy-MM-dd" for <input type="date">. */
export function toInputDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(value: string | Date, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export const returnAction: Record<"DANG_CHO" | "TIEU_HUY" | "KIEM_DINH", Label> = {
  DANG_CHO: { label: "Chờ kiểm tra", tone: "amber" },
  TIEU_HUY: { label: "Chuyển tiêu hủy", tone: "red" },
  KIEM_DINH: { label: "Chờ kiểm định", tone: "violet" },
};
