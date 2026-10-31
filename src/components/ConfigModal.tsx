import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  School,
  UserCheck,
  Phone,
  User,
  Users,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FileText,
  List,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { ClassConfig, Student } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG, POPULAR_SCHOOLS } from '../data/defaultData';
import { cleanPhoneNumber } from '../utils/zaloHelper';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSaveConfig: (newConfig: ClassConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [className, setClassName] = useState(config.className);
  const [teacherName, setTeacherName] = useState(config.teacherName);
  const [zaloPhone, setZaloPhone] = useState(config.zaloPhone);
  const [reporterName, setReporterName] = useState(config.reporterName);
  const [reporterRole, setReporterRole] = useState(config.reporterRole);

  const [activeRosterTab, setActiveRosterTab] = useState<'bulk' | 'list'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [editableStudents, setEditableStudents] = useState<Student[]>(config.students);

  // Danh sách các trường người dùng đã tự nạp để gợi ý
  const [customSchools, setCustomSchools] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('user_custom_schools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (isOpen) {
      setSchoolName(config.schoolName || '');
      setClassName(config.className || '');
      setTeacherName(config.teacherName || '');
      setZaloPhone(config.zaloPhone || '');
      setReporterName(config.reporterName || '');
      setReporterRole(config.reporterRole || '');
      setEditableStudents(config.students || []);
      setBulkText(
        (config.students || [])
          .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
          .join('\n')
      );
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleParseBulkText = () => {
    const lines = bulkText.split('\n');
    const parsed: Student[] = [];
    lines.forEach((line) => {
      let clean = line.trim();
      if (!clean) return;
      // strip preceding numbers like "1. ", "1/ ", "1- ", "01. "
      clean = clean.replace(/^\d+[\.\-\/\:\)\s]+\s*/, '').trim();
      if (clean) {
        let name = clean;
        let phone = '';
        // Match separators like "-", ",", tab, or multiple spaces before phone
        const match = clean.match(/^(.*?)(?:[\-–—,\t;|]\s*|\s{2,})([0-9+() .\-]{8,15})$/);
        if (match) {
          name = match[1].trim();
          phone = cleanPhoneNumber(match[2].trim());
        }
        parsed.push({
          id: `std-${parsed.length + 1}-${Date.now()}`,
          stt: parsed.length + 1,
          name,
          parentPhone: phone || undefined,
        });
      }
    });
    return parsed;
  };

  const handleLoadSampleRoster = () => {
    setBulkText(
      INITIAL_STUDENTS.map(
        (s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`
      ).join('\n')
    );
    setEditableStudents(INITIAL_STUDENTS);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;
    const phone = cleanPhoneNumber(newStudentPhone.trim());
    const nextStt = editableStudents.length + 1;
    const updated = [
      ...editableStudents,
      {
        id: `std-${nextStt}-${Date.now()}`,
        stt: nextStt,
        name,
        parentPhone: phone || undefined,
      },
    ];
    setEditableStudents(updated);
    setBulkText(
      updated
        .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
        .join('\n')
    );
    setNewStudentName('');
    setNewStudentPhone('');
  };

  const handleUpdateStudentPhone = (index: number, val: string) => {
    const updated = [...editableStudents];
    updated[index] = { ...updated[index], parentPhone: val };
    setEditableStudents(updated);
  };

  const handleUpdateStudentGroup = (index: number, group: number) => {
    const updated = [...editableStudents];
    updated[index] = { ...updated[index], group };
    setEditableStudents(updated);
  };

  const handleUpdateStudentRole = (index: number, role: string) => {
    const updated = [...editableStudents];
    updated[index] = { ...updated[index], role };
    setEditableStudents(updated);
  };

  const handleAutoAssignGroups = () => {
    const updated = editableStudents.map((s, idx) => ({
      ...s,
      group: (idx % 4) + 1,
    }));
    setEditableStudents(updated);
  };

  const handleExportCsv = () => {
    let csv = '\uFEFFSTT,Họ và tên,Tổ,Chức vụ,SĐT Phụ huynh\n';
    editableStudents.forEach((s) => {
      csv += `${s.stt},"${s.name}",${s.group || 1},"${s.role || 'Thành viên'}","${s.parentPhone || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DanhSach_Lop_${className || 'HocSinh'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const excelInputRef = useRef<HTMLInputElement | null>(null);

  // Parse Excel vnEdu / SMAS file
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Load SheetJS dynamically if needed
      if (typeof (window as any).XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async = true;
        await new Promise((res, rej) => {
          script.onload = res;
          script.onerror = rej;
          document.head.appendChild(script);
        });
      }

      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        alert('Không thể tải bộ đọc Excel. Vui lòng kiểm tra kết nối mạng!');
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length < 2) {
        alert('File Excel không có đủ dữ liệu!');
        return;
      }

      // Find header row containing "Họ" hoặc "Tên"
      let headerRowIdx = -1;
      let nameColIdx = -1;
      let firstNameColIdx = -1; // Tên riêng
      let lastNameColIdx = -1;  // Họ đệm
      let sttColIdx = -1;
      let phoneColIdx = -1;
      let groupColIdx = -1;
      let roleColIdx = -1;
      let genderColIdx = -1;

      for (let r = 0; r < Math.min(rows.length, 15); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toLowerCase().trim();
          if (val === 'họ và tên' || val === 'họ tên' || val === 'tên học sinh' || val === 'họ và tên học sinh') {
            headerRowIdx = r;
            nameColIdx = c;
          }
          if (val === 'họ và đệm' || val === 'họ đệm' || val === 'họ và tên đệm') {
            headerRowIdx = r;
            lastNameColIdx = c;
          }
          if (val === 'tên') {
            firstNameColIdx = c;
          }
          if (val === 'stt' || val === 'số tt') {
            sttColIdx = c;
          }
          if (val.includes('điện thoại') || val.includes('sđt') || val.includes('phone') || val.includes('liên hệ')) {
            phoneColIdx = c;
          }
          if (val === 'tổ' || val === 'nhóm') {
            groupColIdx = c;
          }
          if (val === 'chức vụ' || val === 'vai trò') {
            roleColIdx = c;
          }
          if (val === 'giới tính' || val === 'phái') {
            genderColIdx = c;
          }
        }
        if (headerRowIdx !== -1) break;
      }

      const importedStudents: Student[] = [];

      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let fullName = '';
        if (nameColIdx !== -1 && row[nameColIdx]) {
          fullName = String(row[nameColIdx]).trim();
        } else if (lastNameColIdx !== -1 && firstNameColIdx !== -1) {
          const last = String(row[lastNameColIdx] || '').trim();
          const first = String(row[firstNameColIdx] || '').trim();
          fullName = `${last} ${first}`.trim();
        } else {
          // Fallback check first text column with at least 2 words
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c] || '').trim();
            if (val.length > 3 && isNaN(Number(val)) && val.includes(' ')) {
              fullName = val;
              break;
            }
          }
        }

        if (!fullName || fullName.toLowerCase().includes('tổng số') || fullName.toLowerCase().includes('học sinh')) {
          continue;
        }

        let phone = '';
        if (phoneColIdx !== -1 && row[phoneColIdx]) {
          phone = cleanPhoneNumber(String(row[phoneColIdx]));
        }

        let grp = (importedStudents.length % 4) + 1;
        if (groupColIdx !== -1 && row[groupColIdx]) {
          const parsedGrp = parseInt(String(row[groupColIdx]).replace(/\D/g, ''), 10);
          if (parsedGrp >= 1 && parsedGrp <= 4) grp = parsedGrp;
        }

        let role = 'Thành viên';
        if (roleColIdx !== -1 && row[roleColIdx]) {
          role = String(row[roleColIdx]).trim();
        }

        let gender: 'Nam' | 'Nữ' | undefined;
        if (genderColIdx !== -1 && row[genderColIdx]) {
          const gStr = String(row[genderColIdx]).toLowerCase();
          if (gStr.includes('nam')) gender = 'Nam';
          if (gStr.includes('nữ') || gStr.includes('nu')) gender = 'Nữ';
        }

        importedStudents.push({
          id: `std-${importedStudents.length + 1}-${Date.now()}`,
          stt: importedStudents.length + 1,
          name: fullName,
          group: grp,
          role,
          gender,
          parentPhone: phone || undefined,
        });
      }

      if (importedStudents.length > 0) {
        setEditableStudents(importedStudents);
        setActiveRosterTab('list');
        alert(`🎉 Đã nhập thành công ${importedStudents.length} học sinh từ file Excel vnEdu/SMAS!`);
      } else {
        alert('Không tìm thấy danh sách học sinh hợp lệ trong file!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file!');
    }
  };

  const handleExportBackup = () => {
    const data = {
      config: {
        schoolName,
        className,
        teacherName,
        zaloPhone,
        reporterName,
        reporterRole,
        students: editableStudents,
      },
      exportDate: new Date().toISOString(),
      appName: 'QUẢN LÝ LỚP CHỦ NHIỆM - PHẠM HẬU',
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_QuanLyLop_${className}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.config) {
          const c = parsed.config;
          if (c.schoolName) setSchoolName(c.schoolName);
          if (c.className) setClassName(c.className);
          if (c.teacherName) setTeacherName(c.teacherName);
          if (c.zaloPhone) setZaloPhone(c.zaloPhone);
          if (c.reporterName) setReporterName(c.reporterName);
          if (c.reporterRole) setReporterRole(c.reporterRole);
          if (Array.isArray(c.students)) setEditableStudents(c.students);
          alert('Đã phục hồi dữ liệu sao lưu thành công!');
        }
      } catch {
        alert('File sao lưu không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteStudent = (index: number) => {
    const updated = editableStudents
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, stt: idx + 1 }));
    setEditableStudents(updated);
    setBulkText(
      updated
        .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
        .join('\n')
    );
  };

  const handleSave = () => {
    let finalStudents = editableStudents;
    if (activeRosterTab === 'bulk') {
      const parsed = handleParseBulkText();
      if (parsed.length > 0) {
        finalStudents = parsed;
      }
    }

    const trimmedSchool = schoolName.trim() || 'Trường THPT';

    // Lưu trường người dùng tự nạp vào danh sách lịch sử để gợi ý
    try {
      if (trimmedSchool && !POPULAR_SCHOOLS.includes(trimmedSchool) && !customSchools.includes(trimmedSchool)) {
        const updatedCustomSchools = [trimmedSchool, ...customSchools].slice(0, 20);
        setCustomSchools(updatedCustomSchools);
        localStorage.setItem('user_custom_schools', JSON.stringify(updatedCustomSchools));
      }
    } catch {}

    const newConfig: ClassConfig = {
      schoolName: trimmedSchool,
      className: className.trim(),
      teacherName: teacherName.trim(),
      zaloPhone: cleanPhoneNumber(zaloPhone.trim()),
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      students: finalStudents,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base">Cấu hình thông tin Lớp học & GVCN</h3>
              <p className="text-xs text-blue-200">
                Thông tin này sẽ được lưu tự động trên trình duyệt của bạn (LocalStorage)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Section: Thông tin trường lớp & GVCN */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-600" />
              Thông tin chung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tên trường học - Cho phép người dùng tự do nạp tên trường */}
              <div className="sm:col-span-2 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-blue-600" />
                    <span>Tên trường học * (Người dùng tự nạp hoặc chọn nhanh)</span>
                  </label>
                  <span className="text-[11px] text-blue-700 font-semibold bg-blue-100/80 px-2 py-0.5 rounded-md">
                    Tự do nhập bất kỳ trường nào
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      list="school-modal-suggestions"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Gõ hoặc dán tên trường của bạn (Ví dụ: THPT Nguyễn Trãi, THCS Đoàn Thị Điểm...)"
                      className="w-full text-sm px-3.5 py-2.5 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-blue-900 shadow-xs"
                    />
                    <datalist id="school-modal-suggestions">
                      {/* Các trường do người dùng tự nạp trước đó */}
                      {customSchools.map((sch) => (
                        <option key={`custom-${sch}`} value={sch}>
                          ⭐ Trường của bạn: {sch}
                        </option>
                      ))}
                      {/* Các trường phổ biến */}
                      {POPULAR_SCHOOLS.map((sch) => (
                        <option key={`pop-${sch}`} value={sch} />
                      ))}
                    </datalist>
                  </div>

                  {/* Danh sách trường người dùng đã tự nạp */}
                  {customSchools.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                        ⭐ Trường bạn đã nạp:
                      </span>
                      {customSchools.slice(0, 5).map((sch) => (
                        <button
                          key={sch}
                          type="button"
                          onClick={() => setSchoolName(sch)}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                            schoolName === sch
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {sch}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gợi ý mẫu trường phổ biến */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-slate-500 font-semibold">Gợi ý mẫu nhanh:</span>
                    {POPULAR_SCHOOLS.slice(0, 8).map((sch) => {
                      const isSelected = schoolName === sch;
                      return (
                        <button
                          key={sch}
                          type="button"
                          onClick={() => setSchoolName(sch)}
                          className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          {sch.replace('THPT ', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 11A1"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên GVCN *
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ví dụ: Cô Lê Hoàng Yến"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Số điện thoại Zalo nhận tin *
                </label>
                <input
                  type="text"
                  value={zaloPhone}
                  onChange={(e) => setZaloPhone(e.target.value)}
                  placeholder="Ví dụ: 0988123456"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dùng để mở trực tiếp chat qua link <em>zalo.me/số_điện_thoại</em>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Họ tên người báo cáo
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chức vụ / Vai trò
                </label>
                <input
                  type="text"
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value)}
                  placeholder="Ví dụ: Lớp trưởng, Lớp phó học tập, Cờ đỏ..."
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section: Danh sách học sinh */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Danh sách học sinh của lớp
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleRoster}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Khôi phục 35 học sinh mẫu
                </button>
              </div>
            </div>

            {/* Sub-tabs: Nhập dạng text vs Xem danh sách */}
            <div className="flex border-b border-slate-200 mb-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveRosterTab('bulk');
                  setBulkText(
                    editableStudents
                      .map((s) => `${s.stt}. ${s.name}${s.parentPhone ? ' - ' + s.parentPhone : ''}`)
                      .join('\n')
                  );
                }}
                className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeRosterTab === 'bulk'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Dán danh sách nhanh (Mỗi bạn 1 dòng)
              </button>

              <button
                type="button"
                onClick={() => {
                  const parsed = handleParseBulkText();
                  if (parsed.length > 0) setEditableStudents(parsed);
                  setActiveRosterTab('list');
                }}
                className={`py-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeRosterTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Xem & Quản lý từng học sinh ({editableStudents.length})
              </button>
            </div>

            {/* Toolbar for Excel, Backup, Auto Groups */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Excel vnEdu / SMAS input */}
                <input
                  type="file"
                  ref={excelInputRef}
                  onChange={handleImportExcel}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 transition cursor-pointer"
                  title="Tải lên file Excel xuất từ cổng vnEdu hoặc SMAS để tự động nhận STT, Họ tên, Tổ, SĐT Phụ huynh"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📥 Nhập file Excel vnEdu/SMAS</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoAssignGroups}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-blue-700 font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="Tự động chia đều học sinh vào Tổ 1, Tổ 2, Tổ 3, Tổ 4 theo thứ tự STT"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chia đều 4 Tổ</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-emerald-700 font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1 transition cursor-pointer"
                  title="Xuất danh sách học sinh ra file CSV/Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1 transition"
                  title="Tải về file sao lưu dự phòng toàn bộ cấu hình"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sao lưu (Backup)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleRestoreBackup}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-purple-700 font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1 transition"
                  title="Khôi phục cấu hình từ file sao lưu JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Phục hồi</span>
                </button>
              </div>
            </div>

            {activeRosterTab === 'bulk' ? (
              <div>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Dán trực tiếp từ Excel hoặc Word. Hỗ trợ kèm SĐT Phụ huynh dạng: <strong>Họ tên - SĐT</strong> (Ví dụ: <em>Nguyễn An Bình - 0912345601</em>).
                </p>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="1. Nguyễn An Bình - 0912345601&#10;2. Trần Gia Bảo - 0912345602&#10;3. Lê Phương Chi - 0912345603..."
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Add new student inline */}
                <form onSubmit={handleAddSingleStudent} className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Họ và tên học sinh..."
                    className="flex-1 min-w-[150px] text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="SĐT Phụ huynh..."
                    className="w-36 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </form>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {editableStudents.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Chưa có học sinh nào trong danh sách.
                    </div>
                  ) : (
                    editableStudents.map((s, index) => (
                      <div
                        key={s.id || index}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-6 text-center font-mono text-slate-400 font-semibold shrink-0">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-slate-800 truncate min-w-[120px]">
                            {s.name}
                          </span>
                        </div>

                        {/* Group Selection */}
                        <div className="shrink-0">
                          <select
                            value={s.group || 1}
                            onChange={(e) => handleUpdateStudentGroup(index, Number(e.target.value))}
                            className="text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50 font-bold text-blue-700 outline-none"
                            title="Chọn Tổ"
                          >
                            <option value={1}>Tổ 1</option>
                            <option value={2}>Tổ 2</option>
                            <option value={3}>Tổ 3</option>
                            <option value={4}>Tổ 4</option>
                          </select>
                        </div>

                        {/* Editable Role */}
                        <div className="shrink-0 hidden sm:block">
                          <input
                            type="text"
                            value={s.role || ''}
                            onChange={(e) => handleUpdateStudentRole(index, e.target.value)}
                            placeholder="Chức vụ"
                            className="w-20 text-[11px] px-1.5 py-0.5 border border-slate-200 rounded-md bg-slate-50/50 outline-none text-slate-700"
                          />
                        </div>

                        {/* Editable Parent Phone */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            value={s.parentPhone || ''}
                            onChange={(e) => handleUpdateStudentPhone(index, e.target.value)}
                            placeholder="SĐT Phụ huynh"
                            className="w-28 text-[11px] px-2 py-0.5 border border-slate-200 rounded-md font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer shrink-0"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {editableStudents.length > 0
              ? `Tổng cộng: ${editableStudents.length} học sinh`
              : 'Chưa có học sinh'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
