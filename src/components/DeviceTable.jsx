'use client';

import { DEPARTMENTS, STATUS_OPTIONS } from "../lib/constants";
import { getPriorityColorClass } from "../lib/helpers";

export default function DeviceTable({
  devices,
  employees,
  handleChangeEmployee,
  handleChangeStatus,
  handleChangeDepartment,
  handleDeleteDevice,
  openChatId,
  toggleChat,
  currentUser,
  ChatBoxComponent,
}) {
  return (
    <div className="overflow-x-auto bg-white rounded shadow max-w-full">
      <table className="min-w-full text-right">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">اسم الزبون</th>
            <th className="p-2">اسم الجهاز</th>
            <th className="p-2">العطل</th>
            <th className="p-2">القسم</th>
            <th className="p-2">الموظف</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">الأولوية</th>
            <th className="p-2">خيارات</th>
            <th className="p-2">محادثة</th>
            {/* الأعمدة الجديدة */}
            <th className="p-2">تاريخ التسليم</th>
            <th className="p-2">وقت التسليم</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 && (
            <tr>
              <td colSpan="12" className="text-center p-4">لا توجد أجهزة</td>
            </tr>
          )}
          {devices.map((device, i) => (
            <tr key={device.id} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{device.customerName}</td>
              <td className="p-2">{device.deviceName}</td>
              <td className="p-2">{device.issue}</td>
              <td className="p-2">
                <select
                  value={device.department}
                  onChange={(e) => handleChangeDepartment(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {DEPARTMENTS.filter(d => d.value !== "").map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <select
                  value={device.employeeName}
                  onChange={(e) => handleChangeEmployee(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {employees.map(emp => (
                    <option key={emp.name} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <select
                  value={device.status}
                  onChange={(e) => handleChangeStatus(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <span
                  className={`text-white px-2 py-1 rounded ${getPriorityColorClass(device.priorityColor)}`}
                >
                  {device.priorityColor}
                </span>
              </td>
              <td className="p-2">
                <button
                  onClick={() => handleDeleteDevice(device.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  حذف
                </button>
              </td>
              <td className="p-2">
                <button
                  onClick={() => toggleChat(device.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2"
                >
                  {openChatId === device.id ? "إخفاء المحادثة" : "عرض المحادثة"}
                  {device.unreadCount > 0 && (
                    <span className="inline-block w-5 h-5 text-xs font-bold bg-red-600 text-white rounded-full text-center">
                      {device.unreadCount}
                    </span>
                  )}
                </button>
              </td>
              {/* الأعمدة الجديدة */}
              <td className="p-2">{device.delivery_date || "-"}</td>
              <td className="p-2">{device.delivery_time || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {openChatId && ChatBoxComponent && (
        <ChatBoxComponent deviceId={openChatId} currentUser={currentUser} />
      )}
    </div>
  );
}
