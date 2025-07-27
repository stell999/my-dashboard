'use client';

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Filters from "../components/Filters";
import SearchBox from "../components/SearchBox";
import DeviceForm from "../components/DeviceForm";

import { STATUS_OPTIONS, PRIORITY_OPTIONS, DEPARTMENTS } from "../lib/constants";
import { getPriorityColorClass } from "../lib/helpers";

import BackupButton from './backup/backup';


const initialFormData = {
  customerName: "",
  deviceName: "",
  issue: "",
  department: "",
  status: STATUS_OPTIONS[0],
  priorityColor: PRIORITY_OPTIONS[2],
  employeeName: "",
};

// --- مكون الشات ---
function ChatBox({ deviceId, currentUser, currentUserDepartment, onReadMessages }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (deviceId) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function fetchMessages() {
    let query = supabase.from("device_notes").select("*").eq("device_id", deviceId);

    if (currentUser !== "admin") {
      query = query.in("sender", ["admin", currentUserDepartment]);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب رسائل الشات:", error);
      setMessages([]);
    } else {
      setMessages(data || []);
      scrollToBottom();
      await markMessagesAsRead(data);
    }
  }

  async function markMessagesAsRead(fetchedMessages) {
    const unreadMessages = fetchedMessages.filter(
      (msg) =>
        msg.sender !== (currentUser === "admin" ? "admin" : currentUserDepartment) &&
        (!msg.read_by || !msg.read_by.includes(currentUser))
    );

    for (const msg of unreadMessages) {
      const newReadBy = msg.read_by ? [...msg.read_by, currentUser] : [currentUser];
      await supabase.from("device_notes").update({ read_by: newReadBy }).eq("id", msg.id);
    }

    if (onReadMessages) onReadMessages();
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const senderName = currentUser === "admin" ? "admin" : currentUserDepartment;

    if (!senderName) {
      alert("غير مسموح لك بإرسال رسالة في هذا الشات");
      return;
    }

    const { error } = await supabase.from("device_notes").insert([
      {
        device_id: deviceId,
        sender: senderName,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        read_by: [senderName],
      },
    ]);

    if (error) {
      alert("خطأ في إرسال الرسالة");
      return;
    }

    setNewMessage("");
    fetchMessages();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <div className="border rounded p-3 bg-white shadow mt-2 max-h-60 overflow-y-auto">
      <div className="mb-2 font-bold text-right">
        محادثة الجهاز #{deviceId} {currentUser !== "admin" && `(قسم: ${currentUserDepartment})`}
      </div>
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">لا توجد رسائل بعد</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.sender === (currentUser === "admin" ? "admin" : currentUserDepartment)
                  ? "bg-blue-200 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              <div className="text-xs text-gray-600">{msg.sender}</div>
              <div>{msg.message}</div>
              <div className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          placeholder="اكتب رسالة..."
          className="flex-grow border rounded p-2"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          aria-label="نص الرسالة"
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 rounded" aria-label="إرسال رسالة">
          إرسال
        </button>
      </div>
    </div>
  );
}

// --- مكون الجدول ---
function DeviceTable({
  devices,
  employees,
  handleChangeEmployee,
  handleChangeStatus,
  handleChangeDepartment,
  handleDeleteDevice,
  openChatId,
  toggleChat,
  currentUser,
  onReadMessages,
}) {
  const currentUserDepartment = currentUser === "admin" ? "" : employees.find((e) => e.name === currentUser)?.department || "";

  return (
    <div className="overflow-x-auto bg-white rounded shadow max-w-full">
      <table className="min-w-full text-right">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">اسم الزبون</th>
            <th className="p-2">اسم الجهاز</th>
            <th className="p-2">التاريخ</th>
            <th className="p-2">الوقت</th>
            <th className="p-2">العطل</th>
            <th className="p-2">القسم</th>
            <th className="p-2">الموظف</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">الأولوية</th>
            <th className="p-2">تاريخ التسليم</th>
            <th className="p-2">وقت التسليم</th>
            <th className="p-2">خيارات</th>
            <th className="p-2">محادثة</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 && (
            <tr>
              <td colSpan="14" className="text-center p-4">لا توجد أجهزة</td>
            </tr>
          )}
          {devices.map((device, i) => (
            <tr key={device.id} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{device.customerName}</td>
              <td className="p-2">{device.deviceName}</td>
              <td className="p-2">{device.date || "-"}</td>
              <td className="p-2">{device.time || "-"}</td>
              <td className="p-2">{device.issue}</td>
              <td className="p-2">
                <select
                  value={device.department}
                  onChange={(e) => handleChangeDepartment(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {DEPARTMENTS.filter((d) => d.value !== "").map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <select
                  value={device.employeeName}
                  onChange={(e) => handleChangeEmployee(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {employees.map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <select
                  value={device.status}
                  onChange={(e) => handleChangeStatus(device.id, e.target.value)}
                  className="border rounded p-1"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="p-2 flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full ${getPriorityColorClass(device.priorityColor)}`}
                  aria-label={`لون الأولوية ${device.priorityColor}`}
                />
                <span className="text-white px-2 py-1 rounded">
                  {device.priorityColor}
                </span>
              </td>
              <td className="p-2">{device.delivery_date || "-"}</td>
              <td className="p-2">{device.delivery_time || "-"}</td>
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
            </tr>
          ))}
        </tbody>
      </table>

      {openChatId && (
        <ChatBox
          deviceId={openChatId}
          currentUser={currentUser}
          currentUserDepartment={currentUserDepartment}
          onReadMessages={onReadMessages}
        />
      )}
    </div>
  );
}

// --- الصفحة الرئيسية ---
export default function Page() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dateFilter, setDateFilter] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [openChatId, setOpenChatId] = useState(null);
const [employeeFilter, setEmployeeFilter] = useState(""); // هنا يتم تعريف الفلتر

  const customerRef = useRef(null);
  const deviceRef = useRef(null);
  const issueRef = useRef(null);
  const departmentRef = useRef(null);
  const statusRef = useRef(null);
  const employeeRef = useRef(null);
  const saveBtnRef = useRef(null);

  const currentUser = "admin"; // أو غيّر حسب المستخدم الحالي

  useEffect(() => {
    fetchEmployees();
    fetchDevicesWithUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("showForm", showForm.toString());
  }, [showForm]);

  useEffect(() => {
    localStorage.setItem("searchTerm", searchTerm);
  }, [searchTerm]);

  async function fetchDevicesWithUnread() {
    try {
      const { data: devicesData, error: devicesError } = await supabase.from("devices").select("*");
      if (devicesError) throw devicesError;

      const { data: unreadMessages, error: unreadError } = await supabase
        .from("device_notes")
        .select("device_id")
        .not("read_by", "cs", `{${currentUser}}`);

      if (unreadError) throw unreadError;

      const unreadCountMap = {};
      unreadMessages.forEach((msg) => {
        unreadCountMap[msg.device_id] = (unreadCountMap[msg.device_id] || 0) + 1;
      });

      const devicesWithUnread = devicesData.map((device) => ({
        ...device,
        unreadCount: unreadCountMap[device.id] || 0,
      }));

      setDevices(devicesWithUnread);
    } catch (error) {
      console.error("خطأ في تحميل الأجهزة مع عدد الرسائل غير المقروءة:", error);
      setDevices([]);
    }
  }
  

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("name, department");

      if (error) {
        throw error;
      }

      setEmployees(Array.isArray(data) ? data : []);

      if (data?.length > 0 && !formData.employeeName) {
        setFormData((prev) => ({
          ...prev,
          employeeName: data[0].name,
          department: data[0].department,
        }));
      }
    } catch (error) {
      console.error("❌ خطأ في جلب الموظفين:", error?.message || JSON.stringify(error) || error);
      setEmployees([]);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    if (name === "employeeName") {
      const emp = employees.find((emp) => emp.name === value);
      setFormData((prev) => ({
        ...prev,
        employeeName: value,
        department: emp ? emp.department : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleKeyDown(e, nextRef) {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  }

  async function handleAddDevice() {
    const { customerName, deviceName, issue, department, employeeName } = formData;
    if (![customerName, deviceName, issue, department, employeeName].every(Boolean)) {
      alert("يرجى تعبئة جميع الحقول");
      return;
    }
    try {
      const now = new Date();
      const isoDate = now.toISOString().split("T")[0];
      const isoTime = now.toLocaleTimeString("en-US", { hour12: false });

      const { error } = await supabase.from("devices").insert([{ ...formData, date: isoDate, time: isoTime }]);
      if (error) throw error;

      await fetchDevicesWithUnread();
      setFormData(initialFormData);
      setShowForm(false);
    } catch (error) {
      console.error("فشل الحفظ:", error);
      alert("حدث خطأ أثناء الحفظ.");
    }
  }

  async function handleDeleteDevice(id) {
    try {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
      setDevices((prev) => prev.filter((d) => d.id !== id));
      if (openChatId === id) setOpenChatId(null);
    } catch (error) {
      console.error("فشل الحذف:", error);
      alert("حدث خطأ أثناء الحذف");
    }
  }

  // التعديل الأساسي: تحديث delivery_date و delivery_time فقط عند الحالة "تم التسليم"
  async function handleChangeStatus(id, newStatus) {
    try {
      let updateData = { status: newStatus };

      if (newStatus === "تم التسليم") {
        const now = new Date();
        updateData.delivery_date = now.toISOString().split("T")[0];
        updateData.delivery_time = now.toLocaleTimeString("en-US", { hour12: false });
      } else {
        updateData.delivery_date = null;
        updateData.delivery_time = null;
      }

      const { error } = await supabase.from("devices").update(updateData).eq("id", id);

      if (error) throw error;

      setDevices((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, ...updateData } : d
        )
      );
    } catch (error) {
      console.error("فشل تحديث الحالة:", error);
      alert("حدث خطأ أثناء تحديث الحالة");
    }
  }

  async function handleChangeEmployee(id, newEmployee) {
    try {
      const emp = employees.find((emp) => emp.name === newEmployee);
      const newDepartment = emp ? emp.department : "";

      const { error } = await supabase
        .from("devices")
        .update({ employeeName: newEmployee, department: newDepartment })
        .eq("id", id);

      if (error) throw error;

      setDevices((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, employeeName: newEmployee, department: newDepartment }
            : d
        )
      );
    } catch (error) {
      console.error("فشل تحديث اسم الموظف أو القسم:", error);
      alert("حدث خطأ أثناء تحديث اسم الموظف أو القسم");
    }
  }

  async function handleChangeDepartment(id, newDepartment) {
    try {
      const { error } = await supabase
        .from("devices")
        .update({ department: newDepartment })
        .eq("id", id);

      if (error) throw error;

      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, department: newDepartment } : d))
      );
    } catch (error) {
      console.error("فشل تحديث القسم:", error);
      alert("حدث خطأ أثناء تحديث القسم");
    }
  }

const filteredDevices = devices
  .filter((d) => d.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
  .filter((d) => statusFilter === "الكل" || d.status === statusFilter)
  .filter((d) => !dateFilter || d.date === dateFilter)
  .filter((d) => employeeFilter === "الكل" || !employeeFilter || d.employeeName === employeeFilter);

  function toggleChat(deviceId) {
    setOpenChatId((prev) => (prev === deviceId ? null : deviceId));
  }
  useEffect(() => {
  const devicesSub = supabase
    .channel('realtime-devices')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'devices' },
      () => {
        fetchDevicesWithUnread(); // تحديث الأجهزة عند أي تغيير
      }
    )
    .subscribe();

  const notesSub = supabase
    .channel('realtime-notes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'device_notes' },
      () => {
        fetchDevicesWithUnread(); // تحديث عدد الرسائل غير المقروءة عند تغيّر المحادثات
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(devicesSub);
    supabase.removeChannel(notesSub);
  };
}, []);


  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Header showForm={showForm} setShowForm={setShowForm} customerRef={customerRef} />
        <Filters
        
  dateFilter={dateFilter}
  setDateFilter={setDateFilter}
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  employeeFilter={employeeFilter}
  setEmployeeFilter={setEmployeeFilter}
/>
        <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        {showForm && (
          <DeviceForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleAddDevice={handleAddDevice}
            handleKeyDown={handleKeyDown}
            refs={{ customerRef, deviceRef, issueRef, employeeRef, departmentRef, statusRef, saveBtnRef }}
            employees={employees}
          />
        )}
        <DeviceTable
          devices={filteredDevices}
          employees={employees}
          handleChangeEmployee={handleChangeEmployee}
          handleChangeStatus={handleChangeStatus}
          handleChangeDepartment={handleChangeDepartment}
          handleDeleteDevice={handleDeleteDevice}
          openChatId={openChatId}
          toggleChat={toggleChat}
          currentUser={currentUser}
          onReadMessages={fetchDevicesWithUnread}
        />
        <BackupButton/>
      </main>
    </div>
  );
}
