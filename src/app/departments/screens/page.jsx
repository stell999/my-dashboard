'use client';

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { STATUS_OPTIONS } from "../../../lib/constants";
// const STATUS_OPTIONS = [
//   "جاري العمل",
//   "تم الإصلاح",
//   "تم التسليم",
//   "لا يصلح",
//   "انتظار",
//   "زبون مابدو",
//   "صلح",
//   "مرتجع"
// ];

const DEPARTMENTS = [
  "مطفي",
  "شاشات",
  "سوفت وير",
  "معالجات",
  "أعطال خفيفة",
];

// بيانات المستخدم المفترض أنها من نظام المصادقة
const currentUser = "employee4"; // يمكن تغييره حسب بيئتك
const currentUserRole = "admin"; // "admin" أو "employee"
const initialDepartment = "شاشات"; // القسم الافتراضي

function SearchBox({ searchTerm, setSearchTerm }) {
  return (
    <input
      type="text"
      placeholder="بحث باسم الزبون..."
      className="w-full p-2 border rounded mb-4"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      aria-label="بحث باسم الزبون"
    />
  );
}

function Filters({ dateFilter, setDateFilter, statusFilter, setStatusFilter }) {
  return (
    <div className="mt-4 flex flex-col md:flex-row md:justify-end gap-4 mb-4">
      <div className="flex items-center gap-2">
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-700 whitespace-nowrap">الحالة:</label>
        <select
          className="border p-2 rounded"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="فلترة حسب الحالة"
        >
          <option value="الكل">الكل</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ChatBox({ deviceId, currentUser, currentUserDepartment }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (deviceId) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("device_notes")
      .select("*")
      .eq("device_id", deviceId)
      .in("sender", ["admin", currentUserDepartment])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("خطأ في جلب رسائل الشات:", error);
      setMessages([]);
    } else {
      setMessages(data);
      scrollToBottom();
    }
  }

async function sendMessage() {
  if (!newMessage.trim()) return;

  let senderName = "شاشات";

  // إرسال الرسالة باسم القسم فقط، مثل "شاشات"
  if (currentUserDepartment) {
    senderName = currentUserDepartment;
  } else {
    alert("غير مسموح لك بإرسال رسالة في هذا الشات");
    return;
  }

  const { error } = await supabase.from("device_notes").insert([
    {
      device_id: deviceId,
      sender: senderName,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: false, // تأكد من وجود هذا العمود في جدول device_notes
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
        محادثة الجهاز #{deviceId} (قسم: {currentUserDepartment})
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
              <div className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleString()}
              </div>
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
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded"
          aria-label="إرسال رسالة"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}

export default function DepartmentPage() {
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openChatId, setOpenChatId] = useState(null);

  // حالة البحث والفلترة
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dateFilter, setDateFilter] = useState("");

  const [currentDepartment, setCurrentDepartment] = useState(initialDepartment);

  const [unreadCounts, setUnreadCounts] = useState({}); // العداد الخاص بالرسائل غير المقروءة

  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

        const statusCounts = STATUS_OPTIONS.map((status) => {
      const count = devices.filter((d) => d.status === status).length;
      return { status, count };
    });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [currentDepartment, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    fetchUnreadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices]);

  async function fetchDevices() {
    let query = supabase.from("devices").select("*").eq("department", currentDepartment);

    // فلترة الحالة
    if (statusFilter !== "الكل") {
      query = query.eq("status", statusFilter);
    }

    // فلترة البحث
    if (searchTerm.trim() !== "") {
      query = query.ilike("customerName", `%${searchTerm.trim()}%`);
    }

    // فلترة التاريخ
    if (dateFilter) {
      const fromDate = new Date(dateFilter);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateFilter);
      toDate.setHours(23, 59, 59, 999);
      query = query.gte("created_at", fromDate.toISOString()).lte("created_at", toDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("خطأ في جلب الأجهزة:", error);
      setDevices([]);
    } else {
      setDevices(data);
    }
  }

  async function fetchEmployees() {
    const { data, error } = await supabase.from("employees").select("name");
    if (!error && data) setEmployees(data.map((emp) => emp.name));
  }

  // جلب عدد الرسائل غير المقروءة لكل جهاز
  async function fetchUnreadCounts() {
    if (devices.length === 0) {
      setUnreadCounts({});
      return;
    }

    const deviceIds = devices.map((d) => d.id);

    // نفترض أن الرسائل غير المقروءة هي التي is_read = false، والمرسلة من الطرف الآخر
    const senderToExclude = currentUser === "admin" ? "admin" : currentDepartment;

    const { data, error } = await supabase
      .from("device_notes")
      .select("device_id")
      .in("device_id", deviceIds)
      .neq("sender", senderToExclude)
      .eq("is_read", false);

    if (error) {
      console.error("خطأ في جلب الرسائل غير المقروءة:", error);
      setUnreadCounts({});
      return;
    }

    // عد الرسائل غير المقروءة لكل جهاز
    const counts = {};
    data.forEach((msg) => {
      counts[msg.device_id] = (counts[msg.device_id] || 0) + 1;
    });

    setUnreadCounts(counts);
  }

  async function markMessagesAsRead(deviceId) {
    const senderToExclude = currentUser === "admin" ? "admin" : currentDepartment;

    const { error } = await supabase
      .from("device_notes")
      .update({ is_read: true })
      .eq("device_id", deviceId)
      .neq("sender", senderToExclude)
      .eq("is_read", false);

    if (error) {
      console.error("خطأ في تحديث حالة الرسائل كمقروءة:", error);
    }
  }

  async function handleChangeStatus(id, newStatus) {
    if (currentUserRole !== "admin") return alert("لا تملك صلاحية تعديل الحالة");

    const { error } = await supabase
      .from("devices")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
    }
  }

  async function handleChangeEmployee(id, newEmployee) {
    const { error } = await supabase
      .from("devices")
      .update({ employeeName: newEmployee })
      .eq("id", id);

    if (!error) {
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, employeeName: newEmployee } : d))
      );
    }
  }

  async function handleChangeDepartment(id, newDepartment) {
    if (currentUserRole !== "admin") return alert("لا تملك صلاحية تعديل القسم");

    const { error } = await supabase
      .from("devices")
      .update({ department: newDepartment })
      .eq("id", id);

    if (!error) {
      // حذف الجهاز من العرض لأنه انتقل لقسم آخر
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert("حدث خطأ أثناء تحديث القسم");
    }
  }

  function toggleChat(deviceId) {
    if (openChatId === deviceId) {
      setOpenChatId(null);
    } else {
      setOpenChatId(deviceId);
      // إعادة تعيين عداد الرسائل غير المقروءة لهذا الجهاز
      setUnreadCounts((prev) => ({ ...prev, [deviceId]: 0 }));
      markMessagesAsRead(deviceId);
    }
  }

  function handleBackClick() {
    setShowPrompt(true);
    setPasswordInput("");
    setErrorMessage("");
  }

  function handlePasswordSubmit() {
    if (passwordInput.trim().toLowerCase() === "admin") {
      router.push("/");
    } else {
      setErrorMessage("كلمة المرور غير صحيحة");
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-blue-900 text-white p-6 flex flex-col">
                <div className="flex justify-end mb-4 bg-white ">
          <img
            src="/logo.png"
            alt="شعار الشركة"
            className="h-12 w-auto object-contain"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {currentUserRole === "admin"
            ? "لوحة الصيانة (مشرف)"
            : `قسم ${currentDepartment}`}
        </h1>
        {currentUserRole === "admin" && (
          <>
            <button
              onClick={handleBackClick}
              className="text-sm underline mb-4 cursor-pointer bg-transparent border-none text-white text-right"
              aria-label="العودة للصفحة الرئيسية"
            >
              ← العودة للصفحة الرئيسية
            </button>

            {showPrompt && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
              >
                <div className="bg-white p-6 rounded shadow max-w-sm w-full text-right">
                  <h2 id="dialog-title" className="text-lg font-bold mb-4">
                    أدخل كلمة المرور للعودة
                  </h2>
                  <input
                    type="password"
                    className="w-full border rounded p-2 mb-2"
                    placeholder="كلمة المرور"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                    aria-label="إدخال كلمة المرور"
                    autoFocus
                  />
                  {errorMessage && (
                    <p className="text-red-600 mb-2" role="alert">
                      {errorMessage}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowPrompt(false)}
                      className="px-4 py-2 rounded border border-gray-400"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handlePasswordSubmit}
                      className="px-4 py-2 rounded bg-blue-600 text-white"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {currentUserRole !== "admin" && (
          <p className="text-sm opacity-70 mb-4">
            ليس لديك صلاحية العودة للصفحة الرئيسية
          </p>
        )}
        {/* ✅ هنا سيتم استخدام statusCounts داخل aside */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-200 border-b border-blue-700 pb-1">
            📊 الحالات
          </h2>
          <ul className="space-y-2 text-sm">
            {statusCounts.map(({ status, count }) => (
              <li
                key={status}
                className="flex justify-between items-center bg-blue-800 rounded-lg px-4 py-2 shadow-sm hover:bg-blue-700 transition"
              >
                <span className="truncate">{status}</span>
                <span className="bg-black text-blue-900 text-xs font-semibold px-3 py-1 rounded-full shadow">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">
          الأجهزة في قسم {currentDepartment}
        </h2>

        {/* البحث والفلترة */}
        <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Filters
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr className="bg-blue-100 text-right">
                      <th className="p-3">الزبون</th>
                      <th className="p-3">الجهاز</th>
                      <th className="p-3">العطل</th>
                       <th className="p-3">التاريخ</th>
                      <th className="p-3">الوقت</th>
                      <th className="p-3">القسم</th>
                      <th className="p-3">الموظف</th>
                      <th className="p-3">الاولوية</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">الشات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center p-4 text-gray-500">
                          لا توجد أجهزة في هذا القسم
                        </td>
                      </tr>
                    ) : (
                      devices.map((d) => (
                        <tr key={d.id} className="border-b align-top">
                          <td className="p-3">{d.customerName}</td>
                          <td className="p-3">{d.deviceName}</td>
                          <td className="p-3">{d.issue}</td>
                          <td className="p-3">{d.date}</td>
                          <td className="p-3">{d.time}</td>
                          <td className="p-3">
                            <select
                              value={d.department}
                              onChange={(e) => handleChangeDepartment(d.id, e.target.value)}
                              className="border rounded px-2 py-1"
                              disabled={currentUserRole !== "admin" && currentUser !== d.employeeName}
                              aria-label={`تغيير القسم للجهاز رقم ${d.id}`}
                            >
                              {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={d.employeeName}
                              onChange={(e) => handleChangeEmployee(d.id, e.target.value)}
                              className="border rounded px-2 py-1"
                              disabled={currentUserRole !== "admin" && currentUser !== d.employeeName}
                              aria-label={`تغيير الموظف للجهاز رقم ${d.id}`}
                            >
                              {employees.map((emp) => (
                                <option key={emp} value={emp}>
                                  {emp}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                          <span
                            className={`inline-block w-4 h-4 rounded-full ${
                              d.priorityColor === "أحمر"
                                ? "bg-red-500"
                                : d.priorityColor === "أصفر" || d.priorityColor === "برتقالي"
                                ? "bg-yellow-400"
                                : d.priorityColor === "أخضر"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          >
                          </span>
                        </td>
                          <td className="p-3">
                            <select
                              value={d.status}
                              onChange={(e) => handleChangeStatus(d.id, e.target.value)}
                              className="border rounded px-2 py-1"
                              disabled={currentUserRole !== "admin" && currentUser !== d.employeeName}
                              aria-label={`تغيير حالة الجهاز رقم ${d.id}`}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-center relative">
                            <button
                              onClick={() => toggleChat(d.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded relative"
                              aria-expanded={openChatId === d.id}
                              aria-controls={`chatbox-${d.id}`}
                            >
                              {openChatId === d.id ? "إغلاق الشات" : "فتح الشات"}
        
                              {/* عداد الرسائل غير المقروءة */}
                              {unreadCounts[d.id] > 0 && openChatId !== d.id && (
                                <span
                                  className="absolute top-0 right-0 -mt-1 -mr-1 inline-flex items-center justify-center
                                            px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
                                  aria-label={`${unreadCounts[d.id]} رسالة غير مقروءة`}
                                >
                                  {unreadCounts[d.id]}
                                </span>
                              )}
                            </button>
        
                            {/* صندوق الشات */}
                            {openChatId === d.id && (
                              <div id={`chatbox-${d.id}`} className="mt-2">
                                <ChatBox
                                  deviceId={d.id}
                                  currentUser={currentUserRole === "admin" ? "admin" : currentUser}
                                  currentUserDepartment={currentDepartment}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
      </main>
    </div>
  );
}
