'use client';


export default function Header({ showForm, setShowForm, customerRef }) {
  return (
    <div className="mb-3 px-3 py-3 bg-white shadow-md rounded-md flex items-center justify-between ">

      {/* زر الإضافة - أقصى اليسار */}
      <button
        onClick={() => {
          setShowForm((prev) => {
            if (!prev) setTimeout(() => customerRef.current?.focus(), 100);
            return !prev;
          });
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-10 py-2 rounded-3xl transition duration-300"
      >
        + إضافة جهاز
      </button>

      {/* اللوغو - في الوسط */}
      <div className="flex-1 flex justify-center pointer-events-none px-4">
        <img src="/logo.png" alt="Logo" className="h-6 w-auto object-contain" />
      </div>

      {/* العنوان - على اليمين */}
      <div className="flex items-center gap-2 text-gray-900 text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis">
        📦 الأجهزة المستلمة
      </div>
    </div>
  );
}
