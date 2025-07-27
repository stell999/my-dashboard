'use client';

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

export default function Page() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      const { data, error } = await supabase.from("devices").select("*");
      if (error) {
        console.error("Error fetching devices:", error);
      } else {
        setDevices(data);
      }
    };

    fetchDevices();
  }, []);

  const handleBackup = () => {
    const worksheet = XLSX.utils.json_to_sheet(devices);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devices");
    XLSX.writeFile(workbook, "Backup.xlsx");
  };

  return (
    <div className="relative min-h-screen p-10">
      <button
        onClick={handleBackup}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}    


