'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SearchBox from '../../components/SearchBox';

export const DEPARTMENTS = [
  { value: "", label: "الكل" },
  { value: "مطفي", label: "مطفي" },
  { value: "شاشات", label: "شاشات" },
  { value: "سوفت وير", label: "سوفت وير" },
  { value: "معالجات", label: "معالجات" },
  { value: "أعطال خفيفة", label: "أعطال خفيفة" }
];

export default function DeliveredDevicesArchive() {
  const [localDevices, setLocalDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const router = useRouter();

  // 1. تهيئة IndexedDB مع إصدار متقدم
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PermanentDevicesArchive', 3);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('devices')) {
          const store = db.createObjectStore('devices', { keyPath: 'id' });
          store.createIndex('by_customer', 'customerName');
          store.createIndex('by_date', 'delivery_date');
          store.createIndex('by_department', 'department');
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, []);

  // 2. حفظ البيانات مع علامة أرشيفية دائمة
  const archiveDevicesPermanently = useCallback(async (devices) => {
    try {
      const db = await initDB();
      const tx = db.transaction(['devices', 'metadata'], 'readwrite');
      const store = tx.objectStore('devices');
      const metaStore = tx.objectStore('metadata');
      
      const archiveDate = new Date().toISOString();
      const devicesToSave = devices.map(device => ({
        ...device,
        archivedAt: archiveDate,
        isPermanent: true
      }));
      
      await Promise.all([
        ...devicesToSave.map(device => store.put(device)),
        metaStore.put({ key: 'last_archived', value: archiveDate })
      ]);
      
      return devicesToSave;
    } catch (error) {
      console.error('فشل في الأرشفة الدائمة:', error);
      throw error;
    }
  }, [initDB]);

  // 3. جلب البيانات المحفوظة
  const getArchivedDevices = useCallback(async (type = 'all') => {
    try {
      const db = await initDB();
      const tx = db.transaction('devices', 'readonly');
      const store = tx.objectStore('devices');
      
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => {
          let result = request.result || [];
          if (type === 'permanent') {
            result = result.filter(d => d.isPermanent);
          }
          resolve(result);
        };
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('فشل في جلب الأرشيف:', error);
      return [];
    }
  }, [initDB]);

  // 4. مزامنة البيانات من Supabase
  const syncFromSupabase = useCallback(async () => {
    try {
      setLoading(true);
      setStorageStatus('جاري المزامنة...');
      
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('status', 'تم التسليم')
        .order('delivery_date', { ascending: false });
      
      if (error) throw error;
      
      const archived = await archiveDevicesPermanently(data);
      
      await supabase
        .from('devices')
        .delete()
        .in('id', data.map(d => d.id));
      
      setLocalDevices(prev => [...archived, ...prev]);
      setStorageStatus(`تم أرشفة ${data.length} جهازاً`);
    } catch (error) {
      console.error('خطأ في المزامنة:', error);
      setStorageStatus('فشل في المزامنة - جاري استعادة البيانات المحلية');
      const localData = await getArchivedDevices('permanent');
      setLocalDevices(localData);
    } finally {
      setLoading(false);
    }
  }, [archiveDevicesPermanently, getArchivedDevices]);

  // 5. التحكم في مساحة التخزين
  const checkStorage = useCallback(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);
      setStorageStatus(`المساحة المستخدمة: ${percentUsed}%`);
    }
  }, []);

  // 6. التأثيرات الرئيسية
  useEffect(() => {
    const loadInitialData = async () => {
      const localData = await getArchivedDevices('permanent');
      setLocalDevices(localData);
      setLoading(false);
      await checkStorage();
    };
    
    loadInitialData();
    
    const syncInterval = setInterval(syncFromSupabase, 3600000);
    
    return () => clearInterval(syncInterval);
  }, [getArchivedDevices, syncFromSupabase, checkStorage]);

  // 7. تصفية البيانات للعرض
  const filteredDevices = localDevices.filter(device => {
    const matchesSearch = device.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment ? device.department === selectedDepartment : true;
    
    // فلترة حسب التاريخ إذا تم تحديده
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button 
          onClick={() => router.push('/')}
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          العودة للصفحة الرئيسية
        </button>
        
        <div>
          <button 
            onClick={syncFromSupabase}
            style={{ 
              padding: '10px', 
              marginLeft: '10px',
              backgroundColor: '#4CAF50',
              color: 'white'
            }}
          >
            مزامنة الآن
          </button>
          <span style={{ marginLeft: '10px', color: '#666' }}>{storageStatus}</span>
        </div>
      </div>

      <h1>📦 الأرشيف الدائم للأجهزة المسلمة</h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
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
            {DEPARTMENTS.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
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
          <p style={{ textAlign: 'left' }}>عدد الأجهزة: {filteredDevices.length}</p>
          <div style={{ overflowX: 'auto', marginTop: '10px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              boxShadow: '0 2px 3px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0
                }}>
                  {[
                    'الزبون', 'الجهاز', 'تاريخ الاستلام', 
                    'وقت الاستلام', 'القسم', 'اسم الموظف',
                    'تاريخ التسليم', 'وقت التسليم', 'تاريخ الأرشفة'
                  ].map((header, index) => (
                    <th key={index} style={{
                      padding: '12px 15px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'right'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id} style={{
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #eee',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}>
                    <td style={{ padding: '12px 15px' }}>{device.customerName}</td>
                    <td style={{ padding: '12px 15px' }}>{device.deviceName}</td>
                    <td style={{ padding: '12px 15px' }}>{device.date}</td>
                    <td style={{ padding: '12px 15px' }}>{device.time}</td>
                    <td style={{ padding: '12px 15px' }}>{device.department}</td>
                    <td style={{ padding: '12px 15px' }}>{device.employeeName}</td>
                    <td style={{ padding: '12px 15px' }}>{device.delivery_date}</td>
                    <td style={{ padding: '12px 15px' }}>{device.delivery_time}</td>
                    <td style={{ 
                      padding: '12px 15px',
                      color: '#666',
                      fontSize: '0.9em'
                    }}>
                      {new Date(device.archivedAt).toLocaleDateString()}
                    </td>
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