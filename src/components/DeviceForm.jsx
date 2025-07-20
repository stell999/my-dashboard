'use client';

import { DEPARTMENTS, STATUS_OPTIONS, PRIORITY_OPTIONS } from "../lib/constants";

export default function DeviceForm({ formData, handleInputChange, handleAddDevice, handleKeyDown, refs, employees }) {
  const {
    customerRef,
    deviceRef,
    issueRef,
    employeeRef,
    departmentRef,
    statusRef,
    saveBtnRef,
  } = refs;

  const inputClass =
    "border border-gray-300 rounded-lg p-2 text-right text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition";

  const flexInputStyle = {
    flexGrow: 1,
    minWidth: "150px",
    maxWidth: "320px",
  };

  // خريطة ألوان الأولوية بالـ Tailwind classes
  const priorityColorMap = {
    أحمر: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    أصفر: "bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-400",
    أخضر: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  };

  const btnColorClass = priorityColorMap[formData.priorityColor] || "bg-green-600 hover:bg-green-700 focus:ring-green-500";

  return (
    <div className="mb-6 bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
      <h3 className="text-xl font-bold mb-6 text-gray-800 text-right">إضافة جهاز جديد</h3>

      {/* صف 1 */}
      <div className="flex flex-wrap gap-5 mb-6 justify-start">
        <input
          type="text"
          name="customerName"
          placeholder="اسم الزبون"
          className={inputClass}
          style={flexInputStyle}
          value={formData.customerName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, deviceRef)}
          ref={customerRef}
          autoComplete="off"
        />
        <input
          type="text"
          name="deviceName"
          placeholder="اسم الجهاز"
          className={inputClass}
          style={flexInputStyle}
          value={formData.deviceName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, issueRef)}
          ref={deviceRef}
          autoComplete="off"
        />
        <input
          type="text"
          name="issue"
          placeholder="العطل أو المشكلة"
          className={inputClass}
          style={flexInputStyle}
          value={formData.issue}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, employeeRef)}
          ref={issueRef}
          autoComplete="off"
        />
      </div>

      {/* صف 2 */}
      <div className="flex flex-wrap gap-5 mb-6 justify-start">
        <select
          name="employeeName"
          className={inputClass}
          style={flexInputStyle}
          value={formData.employeeName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, departmentRef)}
          ref={employeeRef}
        >
          <option value="" disabled>اختر الموظف</option>
          {employees.map(emp => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
          ))}
        </select>

        <select
          name="department"
          className={inputClass}
          style={flexInputStyle}
          value={formData.department}
          onChange={handleInputChange}
          ref={departmentRef}
        >
          <option value="" disabled>اختر القسم</option>
          {DEPARTMENTS.filter(d => d.value !== "").map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>

        <select
          name="status"
          className={inputClass}
          style={flexInputStyle}
          value={formData.status}
          onChange={handleInputChange}
          ref={statusRef}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* صف 3 */}
      <div className="flex flex-wrap gap-5 mb-3 justify-start items-center">
        <select
          name="priorityColor"
          className={inputClass}
          style={{ ...flexInputStyle, maxWidth: "180px" }}
          value={formData.priorityColor}
          onChange={handleInputChange}
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <button
          onClick={handleAddDevice}
          ref={saveBtnRef}
          type="button"
          className={`rounded-lg border border-gray-300 text-white text-base font-semibold py-2 px-4 focus:outline-none focus:ring-2 transition flex-grow max-w-[320px] ${btnColorClass}`}
        >
          حفظ الجهاز
        </button>
      </div>
    </div>
  );
}
