'use client';

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

const DEPARTMENTS = [
  "مطفي",
  "شاشات",
  "سوفت وير",
  "معالجات",
  "أعطال خفيفة",
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", department: "" });
  const [editId, setEditId] = useState(null);

  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase.from("employees").select("*").order("id");
    if (error) {
      alert("خطأ في جلب الموظفين: " + error.message);
    } else {
      setEmployees(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.department.trim()) {
      alert("يرجى تعبئة الاسم والقسم");
      return;
    }
    const { error } = await supabase.from("employees").insert([{ name: form.name.trim(), department: form.department.trim() }]);
    if (error) {
      alert("خطأ في الإضافة: " + error.message);
    } else {
      setForm({ name: "", department: "" });
      fetchEmployees();
    }
  }

  function startEdit(emp) {
    setEditId(emp.id);
    setForm({ name: emp.name, department: emp.department });
  }

  async function handleEdit() {
    if (!form.name.trim() || !form.department.trim()) {
      alert("يرجى تعبئة الاسم والقسم");
      return;
    }
    const { error } = await supabase.from("employees").update({ name: form.name.trim(), department: form.department.trim() }).eq("id", editId);
    if (error) {
      alert("خطأ في التعديل: " + error.message);
    } else {
      setForm({ name: "", department: "" });
      setEditId(null);
      fetchEmployees();
    }
  }

  async function handleDelete(id) {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
    } else {
      if (editId === id) {
        setEditId(null);
        setForm({ name: "", department: "" });
      }
      fetchEmployees();
    }
  }

  return (
    <div dir="rtl" className="max-w-3xl mx-auto p-6">
      <Link href="/">
        <button className="mb-4 bg-gray-300 px-3 py-1 rounded hover:bg-gray-400">
          العودة للرئيسية
        </button>
      </Link>

      <h1 className="text-2xl font-bold mb-4">إدارة الموظفين</h1>

      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl mb-2">{editId ? "تعديل موظف" : "إضافة موظف جديد"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="اسم الموظف"
            value={form.name}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">اختر القسم</option>
            {DEPARTMENTS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          {editId ? (
            <>
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
              >
                حفظ التعديل
              </button>
              <button
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", department: "" });
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              إضافة موظف
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded shadow">
        {loading ? (
          <p className="p-4 text-center">جاري التحميل...</p>
        ) : employees.length === 0 ? (
          <p className="p-4 text-center text-gray-600">لا يوجد موظفون بعد</p>
        ) : (
          <table className="min-w-full text-right">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">اسم الموظف</th>
                <th className="p-3">القسم</th>
                <th className="p-3">تحكم</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.department}</td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => startEdit(emp)}
                      className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
