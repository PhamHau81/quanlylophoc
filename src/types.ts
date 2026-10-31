export interface Student {
  id: string;
  stt: number;
  name: string;
  group?: number; // Tổ 1, 2, 3, 4
  role?: string; // Lớp trưởng, Lớp phó, Tổ trưởng, Thành viên...
  gender?: 'Nam' | 'Nữ';
  dob?: string;
  parentPhone?: string;
  parentName?: string;
}

export interface ClassConfig {
  schoolName: string;
  className: string;
  teacherName: string;
  zaloPhone: string;
  reporterName: string;
  reporterRole: string;
  students: Student[];
}

export type ReportType = 'ABSENT' | 'VIOLATION' | 'COMMENDATION';

export type AbsentType = 'EXCUSED' | 'UNEXCUSED' | 'LATE' | 'TRUANT';

export type UserRole = 'TEACHER' | 'STUDENT_LEADER';

export interface ReportItem {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  period: string; // "Tiết 1", "Tiết 2", "Cả ngày", ...
  subject: string; // "Toán", "Văn", ...
  type: ReportType;
  absentType?: AbsentType;
  violationTags: string[];
  commendationTags: string[];
  customNote: string;
  students: Student[];
  reporter: string;
  teacherName: string;
  className: string;
  schoolName: string;
  formattedMessage: string;
}

export interface GroupStat {
  groupNumber: number;
  studentCount: number;
  absentCount: number;
  violationCount: number;
  commendationCount: number;
  score: number; // Base 100 + commendation*5 - violation*3 - absent*2
}
