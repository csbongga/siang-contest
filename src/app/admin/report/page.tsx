'use client';

import { FileSpreadsheet, Download } from 'lucide-react';

export default function AdminReportPage() {
  const handleDownloadExcel = () => {
    window.location.href = '/api/admin/report/excel';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-gold">ดาวน์โหลดรายงาน</h1>
        <p className="text-gray-300 mt-1">ส่งออกข้อมูลคะแนนและประวัติทั้งหมด</p>
      </div>

      <div className="bg-cream rounded-2xl p-8 shadow-xl text-aubergine text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileSpreadsheet size={48} />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">รายงานสรุปผลการแข่งขัน (Excel)</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          ดาวน์โหลดไฟล์ Excel (.xlsx) ซึ่งประกอบด้วยข้อมูล 5 แผ่นงาน:
          สรุปผลการแข่งขัน, คะแนนรายกรรมการ, คะแนนรายเกณฑ์, คะแนนโซเชียล, และประวัติการแก้ไขคะแนน
        </p>
        
        <button 
          onClick={handleDownloadExcel}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg flex items-center gap-3 transition-transform hover:scale-105 mx-auto"
        >
          <Download size={24} />
          ดาวน์โหลดไฟล์ Excel
        </button>
      </div>
    </div>
  );
}
