'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "./lib/supabaseClient";

const DEPARTMENTS = [
  { value: "", label: "اختر القسم" },
  { value: "مطفي", label: "مطفي" },
  { value: "شاشات", label: "شاشات" },
  { value: "سوفت وير", label: "سوفت وير" },
  { value: "معالجات", label: "معالجات" },
  { value: "أعطال خفيفة", label: "أعطال خفيفة" }
];

const STATUS_OPTIONS = [
  "جاري العمل",
  "جاري الصيانة",
  "تم الإصلاح",
  "تم التسليم",
  "لا يصلح"
];

const PRIORITY_OPTIONS = [
  "مستعجل (أحمر)",
  "مُمهل (أصفر)",
  "يُؤجل (أخضر)"
];

const initialFormData = {
  customerName: "",
  deviceName: "",
  issue: "",
  department: "",
  status: STATUS_OPTIONS[0],
  priorityColor: PRIORITY_OPTIONS[2],
  employeeName: "",
};


function getPriorityColorClass(text) {
  if (!text) return "bg-gray-400";
  if (text.includes("أحمر")) return "bg-red-500";
  if (text.includes("أصفر")) return "bg-yellow-400";
  return "bg-green-500";
}

function ChatBox({ deviceId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (deviceId) fetchMessages();
  }, [deviceId]);

  async function fetchMessages() {
    if (!deviceId) return;

    const { data, error } = await supabase
      .from("device_notes")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب الرسائل:", JSON.stringify(error, null, 2));
      setMessages([]);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("device_notes").insert([
      {
        device_id: deviceId,
        sender: currentUser,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      alert("حدث خطأ أثناء إرسال الرسالة");
      return;
    }
    setNewMessage("");
    fetchMessages();
  }

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div
      className="border rounded p-3 bg-white shadow max-w-xl mx-auto my-2"
      style={{ maxHeight: "300px", overflowY: "auto" }}
    >
      <div className="mb-2 font-bold text-right">محادثة الجهاز #{deviceId}</div>
      <div className="space-y-2 overflow-y-auto max-h-60">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">لا توجد رسائل بعد</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded ${
              msg.sender === currentUser ? "bg-blue-200 text-right" : "bg-gray-200 text-left"
            }`}
          >
            <div className="text-xs text-gray-600">{msg.sender}</div>
            <div>{msg.message}</div>
            <div className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</div>
          </div>
        ))}
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
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dateFilter, setDateFilter] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [openChatId, setOpenChatId] = useState(null);

  const customerRef = useRef(null);
  const deviceRef = useRef(null);
  const issueRef = useRef(null);
  const departmentRef = useRef(null);
  const statusRef = useRef(null);
  const employeeRef = useRef(null);
  const saveBtnRef = useRef(null);

  const currentUser = "admin";

  useEffect(() => {
    fetchDevices();
    fetchEmployees();
  }, []);

  useEffect(() => { localStorage.setItem("showForm", showForm.toString()); }, [showForm]);
  useEffect(() => { localStorage.setItem("searchTerm", searchTerm); }, [searchTerm]);

  async function fetchDevices() {
    const { data, error } = await supabase.from("devices").select("*");
    if (error) {
      console.error("خطأ في جلب الأجهزة:", error);
      setDevices([]);
    } else {
      setDevices(Array.isArray(data) ? data : []);
    }
  }

  async function fetchEmployees() {
    const { data, error } = await supabase.from("employees").select("name, department");
    if (error) {
      console.error("خطأ في جلب الموظفين:", error);
      setEmployees([]);
    } else {
      setEmployees(Array.isArray(data) ? data : []);
      if (data?.length > 0 && !formData.employeeName) {
        setFormData((prev) => ({
          ...prev,
          employeeName: data[0].name,
          department: data[0].department,
        }));
      }
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    if (name === "employeeName") {
      const emp = employees.find(emp => emp.name === value);
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

      const { error } = await supabase.from("devices").insert([
        { ...formData, date: isoDate, time: isoTime },
      ]);
      if (error) throw error;

      await fetchDevices();
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

  async function handleChangeStatus(id, newStatus) {
    try {
      const { error } = await supabase.from("devices").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
    } catch (error) {
      console.error("فشل تحديث الحالة:", error);
      alert("حدث خطأ أثناء تحديث الحالة");
    }
  }

  async function handleChangeEmployee(id, newEmployee) {
    try {
      const emp = employees.find(emp => emp.name === newEmployee);
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
        prev.map((d) =>
          d.id === id ? { ...d, department: newDepartment } : d
        )
      );
    } catch (error) {
      console.error("فشل تحديث القسم:", error);
      alert("حدث خطأ أثناء تحديث القسم");
    }
  }

  const filteredDevices = devices
    .filter((d) => d.customerName?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((d) => statusFilter === "الكل" || d.status === statusFilter)
    .filter((d) => !dateFilter || d.date === dateFilter);

  function toggleChat(deviceId) {
    setOpenChatId((prev) => (prev === deviceId ? null : deviceId));
  }

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
        />
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 bg-blue-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة الصيانة</h1>
      <nav>
        <ul className="space-y-4">
          <li><Link href="/">كل الأجهزة</Link></li>
          <li><Link href="/departments/matfi">قسم مطفي</Link></li>
          <li><Link href="/departments/screens">قسم شاشات</Link></li>
          <li><Link href="/departments/software">قسم سوفت وير</Link></li>
          <li><Link href="/departments/processors">قسم معالجات</Link></li>
          <li><Link href="/departments/light">قسم أعطال خفيفة</Link></li>
          <li><Link href="/employees">إدارة الموظفين</Link></li>
        </ul>
      </nav>
    </aside>
  );
}

function Header({ showForm, setShowForm, customerRef }) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-semibold">الأجهزة المستلمة</h2>
      <button
        onClick={() => {
          setShowForm((prev) => {
            if (!prev) setTimeout(() => customerRef.current?.focus(), 100);
            return !prev;
          });
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        إضافة جهاز
      </button>
    </div>
  );
}

function Filters({ dateFilter, setDateFilter, statusFilter, setStatusFilter }) {
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
    </div>
  );
}

function SearchBox({ searchTerm, setSearchTerm }) {
  return (
    <input
      type="text"
      placeholder="بحث باسم الزبون..."
      className="w-full p-2 border rounded mb-4"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
}

function DeviceForm({ formData, handleInputChange, handleAddDevice, handleKeyDown, refs, employees }) {
  const {
    customerRef,
    deviceRef,
    issueRef,
    employeeRef,
    departmentRef,
    statusRef,
    saveBtnRef,
  } = refs;

  return (
    <div className="mb-6 bg-white p-4 rounded shadow max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">إضافة جهاز جديد</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          name="customerName"
          placeholder="اسم الزبون"
          className="border p-2 rounded text-right"
          value={formData.customerName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, deviceRef)}
          ref={customerRef}
        />
        <input
          type="text"
          name="deviceName"
          placeholder="اسم الجهاز"
          className="border p-2 rounded text-right"
          value={formData.deviceName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, issueRef)}
          ref={deviceRef}
        />
        <input
          type="text"
          name="issue"
          placeholder="العطل أو المشكلة"
          className="border p-2 rounded text-right"
          value={formData.issue}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, employeeRef)}
          ref={issueRef}
        />

        <select
          name="employeeName"
          className="border p-2 rounded text-right"
          value={formData.employeeName}
          onChange={handleInputChange}
          onKeyDown={(e) => handleKeyDown(e, departmentRef)}
          ref={employeeRef}
        >
          <option value="">اختر الموظف</option>
          {employees.map(emp => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
          ))}
        </select>

        <select
          name="department"
          className="border p-2 rounded text-right"
          value={formData.department}
          onChange={handleInputChange}
          ref={departmentRef}
        >
          <option value="">اختر القسم</option>
          {DEPARTMENTS.filter(d => d.value !== "").map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>

        <select
          name="status"
          className="border p-2 rounded text-right"
          value={formData.status}
          onChange={handleInputChange}
          ref={statusRef}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select
          name="priorityColor"
          className="border p-2 rounded text-right"
          value={formData.priorityColor}
          onChange={handleInputChange}
        >
          {PRIORITY_OPTIONS.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>

        <button
          onClick={handleAddDevice}
          ref={saveBtnRef}
          className="bg-green-600 text-white py-2 rounded col-span-full"
        >
          حفظ الجهاز
        </button>
      </div>
    </div>
  );
}

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
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-3 border">اسم الزبون</th>
            <th className="py-2 px-3 border">اسم الجهاز</th>
            <th className="py-2 px-3 border">العطل</th>
            <th className="py-2 px-3 border">القسم</th>
            <th className="py-2 px-3 border">الموظف</th>
            <th className="py-2 px-3 border">الحالة</th>
            <th className="py-2 px-3 border">الأولوية</th>
            <th className="py-2 px-3 border">الإجراءات</th>
            <th className="py-2 px-3 border">محادثة</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center p-4">لا توجد أجهزة</td>
            </tr>
          ) : (
            devices.map((device) => (
              <tr key={device.id}>
                <td className="border px-2 py-1 text-right">{device.customerName}</td>
                <td className="border px-2 py-1 text-right">{device.deviceName}</td>
                <td className="border px-2 py-1 text-right">{device.issue}</td>
                <td className="border px-2 py-1 text-right">
                  <select
                    value={device.department || ""}
                    onChange={(e) => handleChangeDepartment(device.id, e.target.value)}
                    className="border p-1 rounded w-full"
                  >
                    <option value="">اختر القسم</option>
                    {DEPARTMENTS.filter(d => d.value !== "").map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-1 text-right">
                  <select
                    value={device.employeeName || ""}
                    onChange={(e) => handleChangeEmployee(device.id, e.target.value)}
                    className="border p-1 rounded w-full"
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map(emp => (
                      <option key={emp.name} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-1 text-right">
                  <select
                    value={device.status || ""}
                    onChange={(e) => handleChangeStatus(device.id, e.target.value)}
                    className="border p-1 rounded w-full"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className={`border px-2 py-1 text-center text-white ${getPriorityColorClass(device.priorityColor)}`}>
                  {device.priorityColor || ""}
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    حذف
                  </button>
                </td>
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => toggleChat(device.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {openChatId === device.id ? "إخفاء" : "عرض"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* صندوق المحادثة */}
      {openChatId && <ChatBox deviceId={openChatId} currentUser={currentUser} />}
    </div>
  );
}
