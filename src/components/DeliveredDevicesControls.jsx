'use client';

import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabaseClient"; // عدل حسب مسار ملف إعداد supabase

export default function DeliveredDevicesControls() {
  const [loading, setLoading] = useState(false);

  async function archiveDeliveredDevices() {
    try {
      setLoading(true);
      const { data: deliveredDevices, error: fetchError } = await supabase
        .from("devices")
        .select("*")
        .eq("status", "تم التسليم");

      if (fetchError) throw fetchError;

      if (!deliveredDevices.length) {
        alert("لا توجد أجهزة بحالة 'تم التسليم' للتصدير.");
        setLoading(false);
        return;
      }

      const exportData = deliveredDevices.map(({ id, ...rest }) => rest);
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الأجهزة_المسلّمة");
      XLSX.writeFile(workbook, "delivered_devices.xlsx");

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("فشل تصدير الأجهزة:", error?.message || error || "خطأ غير معروف");
      alert("❌ حدث خطأ أثناء تصدير الأجهزة:\n" + (error?.message || JSON.stringify(error) || "خطأ غير معروف"));
    }
  }

  async function deleteDeliveredDevices() {
    if (!confirm("هل أنت متأكد من مسح جميع الأجهزة التي حالتها 'تم التسليم'؟ لا يمكن التراجع!")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("devices")
        .delete()
        .eq("status", "تم التسليم");

      if (error) throw error;

      alert("تم مسح جميع الأجهزة التي حالتها 'تم التسليم' بنجاح.");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("فشل مسح الأجهزة:", error?.message || error || "خطأ غير معروف");
      alert("❌ حدث خطأ أثناء مسح الأجهزة:\n" + (error?.message || JSON.stringify(error) || "خطأ غير معروف"));
    }
  }

  return (
<div className="flex gap-4 -mt-4">
  <button
    onClick={() => {
      if (window.confirm("هل أنت متأكد من تصدير الأجهزة المسلّمة؟")) {
        archiveDeliveredDevices();
      }
    }}
    disabled={loading}
    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded transition"
  >
    {loading ? "جاري المعالجة..." : "تصدير الأجهزة المسلّمة"}
  </button>

  <button
    onClick={() => {
      if (window.confirm("هل أنت متأكد من مسح الأجهزة المسلّمة؟")) {
        deleteDeliveredDevices();
      }
    }}
    disabled={loading}
    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded transition"
  >
    {loading ? "جاري المعالجة..." : "مسح الأجهزة المسلّمة"}
  </button>
</div>

  );
}
