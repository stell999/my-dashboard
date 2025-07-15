'use client';

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["جاري العمل", "تم الإصلاح", "تم التسليم", "لا يصلح"];

// افتراضياً، يأتي currentUser وcurrentUserRole وcurrentUserDepartment من مكان المصادقة الحقيقية (auth)
const currentUser = "employee5"; // يمكنك تغييرها في بيئتك الحقيقية
const currentUserRole = "admin"; // "admin" أو "employee"
const currentUserDepartment = "سوفت وير"; // القسم الخاص بالمستخدم (مثال)

function ChatBox({ deviceId, currentUser, currentUserDepartment }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (deviceId) fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function fetchMessages() {
    // جلب الرسائل الخاصة بهذا الجهاز فقط والتي تكون إما من admin أو من قسم سوفت وير
    const { data, error } = await supabase
      .from("device_notes")
      .select("*")
      .eq("device_id", deviceId)
      .in("sender", ["admin", "سوفت وير"]) // فقط الرسائل من هذين الطرفين
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

    // تعيين اسم المرسل وفقاً للحالة
    let senderName = "";
    if (currentUser === "admin") {
      senderName = "admin";
    } else if (currentUserDepartment === "سوفت وير") {
      senderName = "سوفت وير";
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
        محادثة الجهاز #{deviceId} (قسم: سوفت وير)
      </div>
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">لا توجد رسائل بعد</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.sender === (currentUser === "admin" ? "admin" : "سوفت وير")
                  ? "bg-blue-200 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              {/* عرض اسم المرسل */}
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

  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDevices();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchDevices() {
    let query = supabase.from("devices").select("*");
    // جلب الأجهزة فقط لقسم سوفت وير سواء كان أدمن أو موظف، لا تعرض كل الأقسام هنا
    query = query.eq("department", "سوفت وير");

    const { data, error } = await query;

    if (!error && data) setDevices(data);
  }

  async function fetchEmployees() {
    let query = supabase.from("employees").select("name");
    // جلب موظفي قسم سوفت وير فقط
    query = query.eq("department", "سوفت وير");

    const { data, error } = await query;
    if (!error && data) setEmployees(data.map((emp) => emp.name));
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

  function toggleChat(deviceId) {
    setOpenChatId((prev) => (prev === deviceId ? null : deviceId));
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
        <h1 className="text-2xl font-bold mb-6">
          {currentUserRole === "admin"
            ? "لوحة الصيانة (مشرف)"
            : `قسم ${currentUserDepartment}`}
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
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">
          الأجهزة في قسم سوفت وير
        </h2>

        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-blue-100 text-right">
              <th className="p-3">الزبون</th>
              <th className="p-3">الجهاز</th>
              <th className="p-3">العطل</th>
              <th className="p-3">الموظف</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">الشات</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  لا توجد أجهزة في هذا القسم
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id} className="border-b align-top">
                  <td className="p-3">{d.customerName}</td>
                  <td className="p-3">{d.deviceName}</td>
                  <td className="p-3">{d.issue}</td>
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
                    <select
                      value={d.status}
                      onChange={(e) => handleChangeStatus(d.id, e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={currentUserRole !== "admin"}
                      aria-label={`تغيير الحالة للجهاز رقم ${d.id}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleChat(d.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                      aria-expanded={openChatId === d.id}
                      aria-controls={`chatbox-${d.id}`}
                    >
                      {openChatId === d.id ? "إغلاق الشات" : "فتح الشات"}
                    </button>
                    {openChatId === d.id && (
                      <div id={`chatbox-${d.id}`} className="mt-2">
                        <ChatBox
                          deviceId={d.id}
                          currentUser={currentUser}
                          currentUserDepartment={currentUserDepartment}
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
