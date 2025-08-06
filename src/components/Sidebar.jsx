'use client';
import Link from "next/link";
import { STATUS_OPTIONS } from "../lib/constants";

export default function Sidebar({ devices = [], isOpen, onClose }) {
  // حساب عدد الأجهزة لكل حالة
  const statusCounts = STATUS_OPTIONS.map((status) => {
    const count = devices.filter((d) => d.status === status).length;
    return { status, count };
  });

  if (!isOpen) return null; // إذا مش مفتوح، لا تعرض شيء

  return (
    <aside className="fixed top-0 right-0 w-64 h-screen bg-blue-900 text-white p-6 rounded-r-lg shadow-lg flex flex-col z-50 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold select-none text-center text-white">
          لوحة الصيانة
        </h1>
        {/* زر إغلاق */}
        <button
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="text-white text-2xl font-bold hover:text-red-400 transition"
        >
          ×
        </button>
      </div>

      <nav className="mb-8">
        <ul className="space-y-5 text-lg font-medium">
          <li>
            <Link
              href="/"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              كل الأجهزة
            </Link>
          </li>
          <li>
            <Link
              href="/departments/matfi"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              قسم مطفي
            </Link>
          </li>
          <li>
            <Link
              href="/departments/screens"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              قسم شاشات
            </Link>
          </li>
          <li>
            <Link
              href="/departments/software"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              قسم سوفت وير
            </Link>
          </li>
          <li>
            <Link
              href="/departments/processors"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              قسم معالجات
            </Link>
          </li>
          <li>
            <Link
              href="/departments/light"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              قسم أعطال خفيفة
            </Link>
          </li>
          <li>
            <Link
              href="/employees"
              className="block px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              إدارة الموظفين
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-5">
        <h2 className="text-lg font-semibold mb-3 text-blue-200 border-b border-blue-700 pb-1">
          📊 الحالات
        </h2>
<ul className="space-y-1 text-sm">
  {statusCounts.map(({ status, count }) => (
    <li
      key={status}
      className="flex justify-between items-center bg-blue-800 rounded-lg px-4 py-1 shadow-sm hover:bg-blue-700 transition"
      style={{ lineHeight: '1.1' }}  // تقليل line-height
    >
      <span className="truncate">{status}</span>
      <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
        {count}
      </span>
    </li>
  ))}
</ul>

      </div>
    </aside>
  );
}
