'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SearchBox from '../../components/SearchBox';
import { DEPARTMENTS } from '../../lib/constants';
import * as XLSX from 'xlsx';

export default function DeliveredDevicesArchive() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const router = useRouter();

  // دالة تحميل البيانات من Supabase
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setStorageStatus('جاري تحميل البيانات...');
      const { data, error } = await supabase
        .from('archived_devices')
        .select('*')
        .order('delivery_date', { ascending: false });

      if (error) throw error;

      setDevices(data || []);
      setStorageStatus(`تم تحميل ${data?.length || 0} جهازاً`);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      setStorageStatus('فشل في تحميل البيانات');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل البيانات أول مرة والتحديث اليدوي
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // تصدير البيانات إلى Excel
  const exportToExcel = () => {
    if (filteredDevices.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredDevices);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الأرشيف');
    XLSX.writeFile(workbook, `devices_archive_${new Date().toISOString().split('T')[0]}.xls`, { bookType: 'xls' });
  };

  // فلترة البيانات بناءً على البحث، القسم والتاريخ
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment ? device.department === selectedDepartment : true;

    let matchesDate = true;
    if (dateFilter) {
      const deviceDate = new Date(device.delivery_date).toISOString().split('T')[0];
      matchesDate = deviceDate === dateFilter;
    }

    return matchesSearch && matchesDepartment && matchesDate;
  });

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>جاري تحميل الأرشيف...</p>
      <p>{storageStatus}</p>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          العودة للصفحة الرئيسية
        </button>

        <div style={{ marginBottom: '15px', textAlign: 'right' }}>
          <button
            onClick={exportToExcel}
            style={{
              padding: '10px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📤 تصدير إلى Excel
          </button>
        </div>

        <div>
          <button 
            onClick={fetchDevices}
            style={{ 
              padding: '10px', 
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            تحديث البيانات
          </button>
          <span style={{ marginLeft: '10px', color: '#666' }}>{storageStatus}</span>
        </div>
      </div>

      {/* إحصائية عدد الأجهزة */}
<h2
  style={{
    marginBottom: '15px',
    fontSize: '1.5rem',
    fontWeight: '600',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    background: 'linear-gradient(90deg, #000000, #555555)', // من أسود غامق لرمادي متوسط
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  }}
>
  إجمالي الأجهزة المعروضة: <strong>{filteredDevices.length}</strong>
</h2>



<h1
  style={{
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#34495e',
    marginBottom: '30px',
    textAlign: 'center',
    textShadow: '2px 2px 5px rgba(0,0,0,0.1)',
  }}
>
  📦 الأرشيف الدائم للأجهزة المسلمة
</h1>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div style={{ minWidth: '200px' }}>
          <label htmlFor="department-filter" style={{ display: 'block', marginBottom: '5px' }}>
            تصفية حسب القسم:
          </label>
          <select
            id="department-filter"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '8px',
              width: '100%',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">كل الأقسام</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept.value} value={dept.value}>{dept.label}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '200px' }}>
          <label htmlFor="date-filter" style={{ display: 'block', marginBottom: '5px' }}>
            تصفية حسب تاريخ التسليم:
          </label>
          <input
            type="date"
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px',
              width: '100%',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
          {dateFilter && (
            <button 
              onClick={() => setDateFilter('')}
              style={{
                marginTop: '5px',
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              إزالة الفلتر
            </button>
          )}
        </div>
      </div>

      {filteredDevices.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {searchTerm || selectedDepartment || dateFilter 
            ? 'لا توجد نتائج مطابقة للبحث' 
            : 'لا توجد أجهزة في الأرشيف'}
        </p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                  {[
                    'الزبون', 'الجهاز', 'المشكلة', 'تاريخ الاستلام', 
                    'وقت الاستلام', 'القسم', 'اسم الموظف',
                    'تاريخ التسليم', 'وقت التسليم'
                  ].map((header, i) => (
                    <th key={i} style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
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
        </>
      )}
    </div>
  );
}
