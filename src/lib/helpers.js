// lib/helpers.js

export function getPriorityColorClass(priority) {
  switch (priority) {
    case "أحمر":
      return "bg-red-600";
    case "أصفر":
      return "bg-yellow-400 text-black"; // لون نص أسود للوضوح على الأصفر
    case "أخضر":
      return "bg-green-600";
    default:
      return "bg-gray-400";
  }
}
