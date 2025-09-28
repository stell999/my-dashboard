'use client';

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

const DEPARTMENTS = ["مطفي", "شاشات", "سوفت وير", "معالجات", "أعطال خفيفة"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", department: "" });
  const [editId, setEditId] = useState(null);
  const formRef = useRef(null);

  async function fetchEmployees() {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      console.error("Fetch error:", error);
      alert("خطأ في جلب الموظفين: " + error.message);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.department.trim()) {
      alert("يرجى تعبئة الاسم والقسم");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name: form.name.trim(),
          department: form.department.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      console.error("Insert error:", error);
      alert("خطأ في الإضافة: " + error.message);
    } else {
      setEmployees((prev) => (data ? [...prev, data] : prev));
      setForm({ name: "", department: "" });
    }
  }

  function startEdit(emp) {
    setEditId(emp.id);
    setForm({ name: emp.name, department: emp.department });
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleEdit() {
    if (!form.name.trim() || !form.department.trim()) {
      alert("يرجى تعبئة الاسم والقسم");
      return;
    }
    if (editId == null) return;

    const { error } = await supabase
      .from("employees")
      .update({
        name: form.name.trim(),
        department: form.department.trim(),
      })
      .eq("id", editId);

    if (error) {
      console.error("Update error:", error);
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
      console.error("Delete error:", error);
      alert("خطأ في الحذف: " + error.message);
    } else {
      if (editId === id) {
        setEditId(null);
        setForm({ name: "", department: "" });
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">إدارة الموظفين</h1>
        <Link href="/">
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            العودة للرئيسية
          </button>
        </Link>
      </div>

      {/* بطاقة النموذج */}
      <div ref={formRef} className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editId ? "تعديل موظف" : "إضافة موظف جديد"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-slate-600">اسم الموظف</label>
            <input
              type="text"
              name="name"
              placeholder="اكتب الاسم الكامل"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-medium text-slate-600">القسم</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">اختر القسم</option>
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {editId ? (
            <>
              <button
                onClick={handleEdit}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                حفظ التعديل
              </button>
              <button
                onClick={() => {
                  setEditId(null);
                  setForm({ name: "", department: "" });
                }}
                className="inline-flex items-center rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "جاري الإضافة..." : "إضافة موظف"}
            </button>
          )}
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-600">جاري التحميل...</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-center text-slate-500">لا يوجد موظفون بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/75">
                <tr className="text-xs uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3 text-start">#</th>
                  <th className="px-4 py-3 text-start">اسم الموظف</th>
                  <th className="px-4 py-3 text-start">القسم</th>
                  <th className="px-4 py-3 text-start">تحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp, idx) => (
                  <tr key={emp.id} className="even:bg-slate-50/60 hover:bg-slate-100/60">
                    <td className="px-4 py-3 align-middle text-sm text-slate-700">{idx + 1}</td>
                    <td className="px-4 py-3 align-middle text-sm font-medium text-slate-900">
                      {emp.name}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                        {emp.department || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(emp)}
                          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
                        >
                          تعديل القسم
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-xs text-slate-500">
                    إجمالي: {employees.length} موظف
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
