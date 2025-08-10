'use client';

import * as XLSX from 'xlsx';
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Filters from "../components/Filters";
import SearchBox from "../components/SearchBox";
import DeviceForm from "../components/DeviceForm";
import DeliveredDevicesControls from '../components/DeliveredDevicesControls'; // عدل المسار حسب مكان المكون

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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (deviceId && open) fetchMessages();
  }, [deviceId, open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  async function fetchMessages() {
    let query = supabase.from("device_notes").select("*").eq("device_id", deviceId);

    if (currentUser !== "admin") {
      query = query.in("sender", ["admin", currentUserDepartment]);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب الرسائل:", error);
      setMessages([]);
    } else {
      setMessages(data || []);
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
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const senderName = currentUser === "admin" ? "admin" : currentUserDepartment;

    const { error } = await supabase.from("device_notes").insert([
      {
        device_id: deviceId,
        sender: senderName,
        message: trimmed,
        created_at: new Date().toISOString(),
        read_by: [senderName],
      },
    ]);

    if (error) {
      alert("حدث خطأ أثناء إرسال الرسالة.");
      return;
    }

    setNewMessage("");
    fetchMessages();
  }

  return (
    <div>
      {/* زر فتح الشات */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 transition z-50"
      >
        عرض الشات
      </button>

      {/* مربع الشات */}
      {open && (
        <div
          ref={chatBoxRef}
          className="fixed bottom-16 left-4 w-80 max-h-[400px] bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col text-sm z-50"
          style={{ maxHeight: "400px" }}
        >
          {/* رأس الشات مع زر إغلاق */}
          <div className="flex justify-between items-center bg-blue-600 text-white rounded-t-lg px-4 py-2 font-semibold select-none">
            <button
              onClick={() => setOpen(false)}
              aria-label="إغلاق الشات"
              className="hover:bg-blue-800 rounded px-2 py-1 transition"
            >
              ✕
            </button>
            <span className="flex-grow text-center">
              🛠️ جهاز #{deviceId} {currentUser !== "admin" && `(${currentUserDepartment})`}
            </span>
            <div style={{ width: 32 }}></div>
          </div>

          {/* صندوق الرسائل */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 italic">لا توجد رسائل بعد</div>
            ) : (
              messages.map((msg) => {
                const isMine =
                  msg.sender === (currentUser === "admin" ? "admin" : currentUserDepartment);
                return (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg text-xs max-w-[85%] shadow-sm ${
                      isMine ? "bg-blue-100 self-end text-right" : "bg-gray-100 self-start text-left"
                    }`}
                  >
                    <div className="text-[10px] text-gray-600 font-semibold">{msg.sender}</div>
                    <div className="mt-1 whitespace-pre-wrap break-words">{msg.message}</div>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* مربع إدخال الرسالة وزر الإرسال */}
          <div className="flex gap-2 p-3 border-t border-gray-300">
            <input
              type="text"
              placeholder="اكتب رسالتك..."
              className="flex-grow border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              autoComplete="off"
              aria-label="نص الرسالة"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-5 rounded-md font-semibold hover:bg-blue-700 transition"
              aria-label="إرسال رسالة"
            >
              إرسال
            </button>
          </div>
        </div>
      )}
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
      <table className="min-w-[1100px] whitespace-nowrap">
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
  className={`px-3 py-1 rounded flex items-center gap-2 text-white ${
    openChatId === device.id ? "bg-yellow-500" : "bg-blue-600 hover:bg-blue-700"
  }`}
>
  {openChatId === device.id ? "إخفاء" : "عرض"}
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

  const [archivedDevices, setArchivedDevices] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchDevicesWithUnread();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
      if (showArchive) {
        fetchArchivedDevices();
      }
    }, [searchTerm, showArchive]);

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

      // فرز الأجهزة بحيث الأحدث (حسب التاريخ والوقت) تظهر أولاً
      const devicesWithUnread = devicesData
        .map((device) => ({
          ...device,
          unreadCount: unreadCountMap[device.id] || 0,
        }))
        .sort((a, b) => {
          // نرتب حسب التاريخ أولاً (نصّف الـ ISO string)
          if (a.date === b.date) {
            return b.time.localeCompare(a.time); // الوقت الأحدث أولاً
          }
          return b.date.localeCompare(a.date); // التاريخ الأحدث أولاً
        });

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
async function archiveDeliveredDevices() {
  try {
    const { data: deliveredDevices, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('status', 'تم التسليم');

    if (fetchError) throw fetchError;
    if (!deliveredDevices || deliveredDevices.length === 0) {
      alert('لا توجد أجهزة بحالة "تم التسليم" لترحيلها.');
      return;
    }

    const { error: insertError } = await supabase
      .from('archived_devices')
      .insert(deliveredDevices);

    if (insertError) throw insertError;

    const idsToDelete = deliveredDevices.map(device => device.id);

    const { error: deleteError } = await supabase
      .from('devices')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;

    alert(`تم ترحيل ${deliveredDevices.length} جهازًا بنجاح إلى الأرشيف.`);
    fetchDevicesWithUnread();

    // استدعاء fetchArchivedDevices فقط إذا عرّفتها
    if (typeof fetchArchivedDevices === 'function') {
      fetchArchivedDevices();
    }
  } catch (error) {
    console.error('خطأ في ترحيل الأجهزة:', error);
    alert('حدث خطأ أثناء ترحيل الأجهزة.');
  }
}

    async function fetchArchivedDevices() {
    try {
      const { data, error } = await supabase
        .from('archived_devices')
        .select('*')
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setArchivedDevices(data || []);
    } catch (error) {
      console.error("خطأ في تحميل الأرشيف:", error);
      setArchivedDevices([]);
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

  async function handleChangeStatus(id, newStatus) {
    try {
      const updateData = { status: newStatus };

      if (newStatus === "تم التسليم") {
        const now = new Date();
        updateData.delivery_date = now.toISOString().split("T")[0];
        updateData.delivery_time = now.toTimeString().split(" ")[0];  // << هنا الصيغة الصحيحة للعمود time
      } else {
        updateData.delivery_date = null;
        updateData.delivery_time = null;
      }

      const { error } = await supabase
        .from("devices")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchDevicesWithUnread();
    } catch (error) {
      console.error("فشل تحديث الحالة:", error);
      alert("حدث خطأ أثناء تحديث الحالة: " + (error.message || error));
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
  .filter((d) =>
    d.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((d) => statusFilter === "الكل" || d.status === statusFilter)
  .filter((d) => !dateFilter || d.date === dateFilter)
  .filter(
    (d) =>
      employeeFilter === "الكل" || !employeeFilter || d.employeeName === employeeFilter
  );

  const filteredArchivedDevices = archivedDevices.filter((d) =>
    d.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button
        onClick={() => setSidebarOpen(v => !v)}
        className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        {sidebarOpen ? "إخفاء القائمة" : "عرض القائمة"}
      </button>
      <Sidebar devices={devices} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 p-6">
        <Header showForm={showForm} setShowForm={setShowForm} customerRef={customerRef} />
                                <button onClick={archiveDeliveredDevices} style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
  ترحيل الأجهزة التي تم تسليمها
</button>
        <Filters
        
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                employeeFilter={employeeFilter}
                setEmployeeFilter={setEmployeeFilter}
              />
        {showArchive && (
          <div className="mt-6 bg-white rounded shadow p-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">بيانات الأرشيف</h2>
            {archivedDevices.length === 0 ? (
              <p>لا توجد بيانات في الأرشيف.</p>
            ) : (
              <table className="min-w-full text-right text-sm">
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
                  </tr>
                </thead>
                <tbody>
                  {archivedDevices.map((device, i) => (
                    <tr key={device.id} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{device.customerName}</td>
                      <td className="p-2">{device.deviceName}</td>
                      <td className="p-2">{device.date || "-"}</td>
                      <td className="p-2">{device.time || "-"}</td>
                      <td className="p-2">{device.issue}</td>
                      <td className="p-2">{device.department}</td>
                      <td className="p-2">{device.employeeName}</td>
                      <td className="p-2">{device.status}</td>
                      <td className="p-2">{device.priorityColor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      <DeliveredDevicesControls />
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
