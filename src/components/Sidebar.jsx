'use client';
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-blue-900 text-white p-6 rounded-lg shadow-lg flex flex-col">
<h1 className="text-5xl font-extrabold mb-8 select-none text-center text-gray-300">
  لوحة الصيانة
</h1>
      <nav>
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
    </aside>
  );
}
