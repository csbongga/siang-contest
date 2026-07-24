'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-cream p-8 rounded-2xl shadow-xl">
          <h2 className="font-display text-2xl font-bold text-aubergine mb-6 text-center">เข้าสู่ระบบแอดมิน</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รหัสผ่าน (Admin Password)</label>
              <input 
                type="password" 
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 text-sm font-medium">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-pink text-white font-bold py-3 rounded-lg hover:bg-pink/90 transition-colors"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
