'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, Edit3, Heart, FileSpreadsheet, Settings, Megaphone, LogOut } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // อย่าแสดง Sidebar ในหน้า Login
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin', label: 'สถานะภาพรวม', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/results', label: 'คะแนนรวมทั้งหมด', icon: <Trophy size={20} /> },
    { href: '/admin/scores', label: 'จัดการคะแนน', icon: <Edit3 size={20} /> },
    { href: '/admin/social', label: 'คะแนนโซเชียล', icon: <Heart size={20} /> },
    { href: '/admin/report', label: 'ออกรายงาน', icon: <FileSpreadsheet size={20} /> },
    { href: '/admin/settings', label: 'ตั้งค่า & ประวัติ', icon: <Settings size={20} /> },
    { href: '/admin/announce', label: 'จอประกาศผล', icon: <Megaphone size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-aubergine text-white">
      {/* Sidebar for Desktop */}
      <aside className="w-full md:w-64 bg-cream/10 backdrop-blur-md md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-white/20 p-4 flex flex-col">
        <div className="mb-8 hidden md:block">
          <h1 className="font-display font-black text-2xl text-pink text-center">เสียงอยู่ไส</h1>
          <p className="text-center text-sm text-gray-300">Admin Panel v3</p>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-x-auto md:overflow-visible flex md:block pb-2 md:pb-0">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-pink text-white shadow-lg font-bold' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden md:block pt-4 border-t border-white/20">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
