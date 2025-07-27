'use client';

const STATUS_OPTIONS = [
  "جاري العمل",
  "تم الإصلاح",
  "تم التسليم",
  "لا يصلح",
  "انتظار",
  "زبون مابدو",
  "صلح",
  "مرتجع"
];

const EMPLOYEE_NAMES = [
  "حمزة مشهود",
  "علي الصغير",
  "عثمان طالب",
  "محمد نعوس",
  "ايمن السعدو",
  "محمد قديراني",
  "لجين مشهود",
  "براهيم عبد الكريم",
  "عمر حجار",
  "عبد الله حجار",
  "عبد الرزاق",
  "يوسف",
  "احمد نمر",
  "علي مشهود"
];

export default function Filters({
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  employeeFilter,
  setEmployeeFilter
}) {
  return (
    <div className="mt-4 flex flex-col md:flex-row md:justify-end gap-4 mb-4">
      <div className="flex items-center gap-2">
        <label className="text-gray-700 whitespace-nowrap">تاريخ معين:</label>
        <input
          type="date"
          className="border p-2 rounded"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-gray-700 whitespace-nowrap">الحالة:</label>
        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="الكل">الكل</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-gray-700 whitespace-nowrap">الموظف:</label>
        <select
          className="border p-2 rounded"
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
        >
          <option value="الكل">الكل</option>
          {EMPLOYEE_NAMES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
