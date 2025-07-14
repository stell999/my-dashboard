'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // أسماء الحسابات (المستخدمين) المسموح بهم:
  const allowedUsers = {
    admin: "admin",
    matfi: "matfi",
    screens: "screens",
    software: "software",
    processors: "processors",
    light: "light",
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // التحقق من اسم المستخدم
    if (Object.values(allowedUsers).includes(username.trim().toLowerCase())) {
      // تخزين اسم المستخدم في localStorage مثلاً (يمكن استبدالها بجلسة أو أي نظام آخر)
      localStorage.setItem("currentUser", username.trim().toLowerCase());

      // توجه للصفحة الرئيسية أو صفحة حسب القسم
      if (username.trim().toLowerCase() === "admin") {
        router.push("/"); // أدمن يذهب للرئيسية
      } else {
        router.push(`/departments/${username.trim().toLowerCase()}`); // باقي الأقسام
      }
    } else {
      setErrorMsg("اسم الحساب غير صحيح");
    }

    setLoading(false);
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow max-w-sm w-full"
      >
        <h2 className="text-2xl mb-4 text-center font-bold">تسجيل الدخول</h2>

        <label className="block mb-2 text-right font-semibold">اسم الحساب</label>
        <input
          type="text"
          className="w-full p-2 border rounded mb-4 text-left"
          placeholder="ادخل اسم الحساب"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          dir="ltr"
        />

        {errorMsg && (
          <p className="text-red-600 text-sm mb-4 text-center">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </button>

        <div className="mt-4 text-sm text-gray-600">
          <p>أسماء الحسابات المتاحة:</p>
          <ul className="list-disc list-inside">
            <li>الأدمن: <b>admin</b></li>
            <li>قسم مطفي: <b>matfi</b></li>
            <li>قسم شاشات: <b>screens</b></li>
            <li>قسم سوفت وير: <b>software</b></li>
            <li>قسم معالجات: <b>processors</b></li>
            <li>قسم أعطال خفيفة: <b>light</b></li>
          </ul>
        </div>
      </form>
    </div>
  );
}
