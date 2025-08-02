'use client';
import Link from "next/link";
import { STATUS_OPTIONS } from "../lib/constants";
export default function Sidebar({ devices = [] }) {
  // حساب عدد الأجهزة لكل حالة
  const statusCounts = STATUS_OPTIONS.map((status) => {
    const count = devices.filter((d) => d.status === status).length;
    return { status, count };
  });

  return (
    <aside className="w-64 bg-blue-900 text-white p-6 rounded-lg shadow-lg flex flex-col">
      <h1 className="text-5xl font-extrabold mb-8 select-none text-center text-gray-300">
        لوحة الصيانة
      </h1>

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
            <Link href="/departments/matfi" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              قسم مطفي
            </Link>
          </li>
          <li>
            <Link href="/departments/screens" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              قسم شاشات
            </Link>
          </li>
          <li>
            <Link href="/departments/software" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              قسم سوفت وير
            </Link>
          </li>
          <li>
            <Link href="/departments/processors" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              قسم معالجات
            </Link>
          </li>
          <li>
            <Link href="/departments/light" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              قسم أعطال خفيفة
            </Link>
          </li>
          <li>
            <Link href="/employees" className="block px-3 py-2 rounded-md hover:bg-blue-700 transition">
              إدارة الموظفين
            </Link>
          </li>
        </ul>
      </nav>
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
        <span className="bg-black text-white-900 text-xs font-semibold px-3 py-1 rounded-full shadow">
          {count}
        </span>
      </li>
    ))}
  </ul>
    </div>
    </aside>
  );
}
