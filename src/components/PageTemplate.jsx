// ✅ PageTemplate.js
export default function PageTemplate({ children }) {
  return (
    <div className="flex">
      <div className="w-64">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-100 min-h-screen">
        {children}
      </div>
    </div>
  );
}
