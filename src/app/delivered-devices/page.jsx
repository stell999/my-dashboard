'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS } from '../../lib/constants';
import * as XLSX from 'xlsx';

export default function DeliveredDevicesArchive() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [devicesCount, setDevicesCount] = useState(0);
  const router = useRouter();

  const debounceTimeout = useRef(null);
  const searchInputRef = useRef(null);

  // تطبيق debounce على البحث
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 800);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm]);

  // جلب البيانات مع الفلاتر
  const fetchDevices = useCallback(async (search = '', department = '', date = '') => {
    try {
      setLoading(true);
      setStorageStatus('جاري تحميل البيانات...');

      let query = supabase
        .from('archived_devices')
        .select('id, customerName, deviceName, issue, date, time, department, employeeName, delivery_date, delivery_time', { count: 'exact' })
        .order('delivery_date', { ascending: false });

      if (search) query = query.ilike('customerName', `%${search}%`);
      if (department) query = query.eq('department', department);
      if (date) query = query.eq('delivery_date', date);

      const { data, error, count } = await query;
      if (error) throw error;

      setDevices(data || []);
      setDevicesCount(count || 0);
      setStorageStatus(`تم تحميل ${data?.length || 0} جهازاً`);

      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setStorageStatus('فشل في تحميل البيانات');
      setDevices([]);
      setDevicesCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(debouncedSearchTerm, selectedDepartment, dateFilter);
  }, [debouncedSearchTerm, selectedDepartment, dateFilter, fetchDevices]);

  // تصدير كل جدول archived_devices إلى Excel
  const exportToExcel = async () => {
    try {
      setStorageStatus("📦 جاري تحميل جميع البيانات من قاعدة البيانات...");

      const batchSize = 1000; // دفعة كل مرة
      let allData = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('archived_devices')
          .select('id, customerName, deviceName, issue, date, time, department, employeeName, delivery_date, delivery_time')
          .order('id', { ascending: true }) // ترتيب ثابت
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        from += batchSize;

        if (data.length < batchSize) break; // وصلنا لآخر دفعة
      }

      if (allData.length === 0) {
        alert('⚠️ لا توجد بيانات للتصدير');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(allData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأرشيف');
      XLSX.writeFile(workbook, `devices_archive_${new Date().toISOString().split('T')[0]}.xls`, { bookType: 'xls' });

      setStorageStatus(`✅ تم تصدير ${allData.length} سجل من قاعدة البيانات`);
    } catch (error) {
      console.error("❌ خطأ أثناء التصدير:", error);
      setStorageStatus("❌ فشل في التصدير من قاعدة البيانات");
    }
  };

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>جاري تحميل الأرشيف...</p>
      <p>{storageStatus}</p>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => router.push('/')} style={{ padding: '10px', cursor: 'pointer' }}>
          العودة للصفحة الرئيسية
        </button>

        <div style={{ marginBottom: '15px', textAlign: 'right' }}>
          <button onClick={exportToExcel} style={{ padding: '10px 15px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            📤 تصدير إلى Excel
          </button>
        </div>

        <div>
          <button
            onClick={() => fetchDevices(debouncedSearchTerm, selectedDepartment, dateFilter)}
            style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
          >
            تحديث البيانات
          </button>
          <span style={{ marginLeft: '10px', color: '#666' }}>{storageStatus}</span>
        </div>
      </div>

      <h2 style={{ marginBottom: '15px', fontSize: '1.5rem', fontWeight: '600', textShadow: '1px 1px 2px rgba(0,0,0,0.1)', background: 'linear-gradient(90deg, #000000, #555555)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        إجمالي الأجهزة المعروضة: <strong>{devicesCount}</strong>
      </h2>

      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#34495e', marginBottom: '30px', textAlign: 'center', textShadow: '2px 2px 5px rgba(0,0,0,0.1)' }}>
        📦 الأرشيف الدائم للأجهزة المسلمة
      </h1>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>بحث:</label>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن اسم الزبون..."
            style={{ padding: '8px', width: '200px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label htmlFor="department-filter">تصفية حسب القسم:</label>
          <select id="department-filter" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="">كل الأقسام</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '200px' }}>
          <label htmlFor="date-filter">تصفية حسب تاريخ التسليم:</label>
          <input type="date" id="date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }} />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} style={{ marginTop: '5px', padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              إزالة الفلتر
            </button>
          )}
        </div>
      </div>

      {devices.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {searchTerm || selectedDepartment || dateFilter
            ? 'لا توجد نتائج مطابقة للبحث'
            : 'لا توجد أجهزة في الأرشيف'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                {['الزبون', 'الجهاز', 'المشكلة', 'تاريخ الاستلام', 'وقت الاستلام', 'القسم', 'اسم الموظف', 'تاريخ التسليم', 'وقت التسليم']
                  .map((header, i) => (
                    <th key={i} style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 15px' }}>{device.customerName}</td>
                  <td style={{ padding: '12px 15px' }}>{device.deviceName}</td>
                  <td style={{ padding: '12px 15px' }}>{device.issue}</td>
                  <td style={{ padding: '12px 15px' }}>{device.date ? new Date(device.date).toLocaleDateString() : ''}</td>
                  <td style={{ padding: '12px 15px' }}>{device.time}</td>
                  <td style={{ padding: '12px 15px' }}>{device.department}</td>
                  <td style={{ padding: '12px 15px' }}>{device.employeeName}</td>
                  <td style={{ padding: '12px 15px' }}>{device.delivery_date ? new Date(device.delivery_date).toLocaleDateString() : ''}</td>
                  <td style={{ padding: '12px 15px' }}>{device.delivery_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
