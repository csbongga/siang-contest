'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

type Judge = { id: string; name: string; pin: string | null };
type Team = { id: string; name: string };

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [newJudge, setNewJudge] = useState({ id: '', name: '', pin: '' });
  const [newTeam, setNewTeam] = useState({ id: '', name: '' });
  
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchAdminData = async (pwd: string) => {
    try {
      const [judgesRes, teamsRes] = await Promise.all([
        fetch('/api/judges'), fetch('/api/teams')
      ]);
      const judgesData = await judgesRes.json();
      const teamsData = await teamsRes.json();
      
      setJudges(judgesData.judges || []);
      setTeams(teamsData.teams || []);
      setIsAuthenticated(true);
      setMessage(null);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error fetching data' });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData(password);
  };

  const callApi = async (url: string, method: string, body?: any) => {
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${password}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await callApi('/api/judges', 'POST', newJudge);
      setMessage({ type: 'success', text: 'เพิ่มกรรมการสำเร็จ' });
      setNewJudge({ id: '', name: '', pin: '' });
      fetchAdminData(password);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteJudge = async (id: string) => {
    if (!confirm('ยืนยันการลบกรรมการ? (คะแนนที่เคยให้จะถูกลบด้วย)')) return;
    try {
      await callApi(`/api/judges?id=${id}`, 'DELETE');
      setMessage({ type: 'success', text: 'ลบกรรมการสำเร็จ' });
      fetchAdminData(password);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await callApi('/api/teams', 'POST', newTeam);
      setMessage({ type: 'success', text: 'เพิ่มทีมสำเร็จ' });
      setNewTeam({ id: '', name: '' });
      fetchAdminData(password);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('ยืนยันการลบทีม? (คะแนนที่ได้รับจะถูกลบด้วย)')) return;
    try {
      await callApi(`/api/teams?id=${id}`, 'DELETE');
      setMessage({ type: 'success', text: 'ลบทีมสำเร็จ' });
      fetchAdminData(password);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetScores = async () => {
    const code = prompt('หากต้องการล้างคะแนนทั้งหมด พิมพ์ "RESET"');
    if (code !== 'RESET') return;
    try {
      await callApi('/api/admin/reset', 'POST');
      setMessage({ type: 'success', text: 'ล้างคะแนนทั้งหมดสำเร็จ' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16">
          <div className="bg-cream p-8 rounded-2xl shadow-xl">
            <h2 className="font-display text-2xl font-bold text-aubergine mb-6 text-center">เข้าสู่ระบบผู้ดูแลระบบ</h2>
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

  return (
    <div className="pb-24">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-3xl font-bold text-gold">จัดการระบบ (Admin)</h2>
          <button 
            onClick={() => { setIsAuthenticated(false); setPassword(''); }}
            className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* จัดการทีม */}
          <section className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl">
            <h3 className="font-display text-xl font-bold mb-4 border-b pb-2">จัดการทีมแข่งขัน</h3>
            
            <form onSubmit={handleAddTeam} className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="font-bold text-sm text-gray-500">เพิ่มทีมใหม่</h4>
              <div className="flex gap-2">
                <input 
                  placeholder="ID (เช่น t4)" 
                  className="w-1/3 p-2 rounded-md border text-sm" 
                  value={newTeam.id} onChange={e => setNewTeam({...newTeam, id: e.target.value})} required 
                />
                <input 
                  placeholder="ชื่อทีม" 
                  className="flex-1 p-2 rounded-md border text-sm" 
                  value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} required 
                />
              </div>
              <button type="submit" className="w-full bg-cyan text-aubergine font-bold py-2 rounded-md hover:bg-cyan/90 flex justify-center items-center gap-2">
                <Plus size={18} /> เพิ่มทีม
              </button>
            </form>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {teams.map(team => (
                <li key={team.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div>
                    <span className="font-bold text-sm text-pink mr-2">[{team.id}]</span>
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <button onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* จัดการกรรมการ */}
          <section className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl">
            <h3 className="font-display text-xl font-bold mb-4 border-b pb-2">จัดการกรรมการ</h3>
            
            <form onSubmit={handleAddJudge} className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="font-bold text-sm text-gray-500">เพิ่มกรรมการใหม่</h4>
              <div className="flex gap-2">
                <input 
                  placeholder="ID (เช่น j4)" 
                  className="w-1/3 p-2 rounded-md border text-sm" 
                  value={newJudge.id} onChange={e => setNewJudge({...newJudge, id: e.target.value})} required 
                />
                <input 
                  placeholder="ชื่อกรรมการ" 
                  className="flex-1 p-2 rounded-md border text-sm" 
                  value={newJudge.name} onChange={e => setNewJudge({...newJudge, name: e.target.value})} required 
                />
              </div>
              <input 
                placeholder="PIN (4 หลัก) หรือเว้นว่าง" 
                className="w-full p-2 rounded-md border text-sm" 
                maxLength={4}
                value={newJudge.pin} onChange={e => setNewJudge({...newJudge, pin: e.target.value})} 
              />
              <button type="submit" className="w-full bg-gold text-aubergine font-bold py-2 rounded-md hover:bg-gold/90 flex justify-center items-center gap-2">
                <Plus size={18} /> เพิ่มกรรมการ
              </button>
            </form>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {judges.map(judge => (
                <li key={judge.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div>
                    <span className="font-bold text-sm text-pink mr-2">[{judge.id}]</span>
                    <span className="font-medium">{judge.name}</span>
                    {judge.pin && <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">PIN: ***</span>}
                  </div>
                  <button onClick={() => handleDeleteJudge(judge.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="bg-red-900/40 border border-red-500/50 rounded-2xl p-6 text-white shadow-xl mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-red-400 mb-1">ล้างคะแนนทั้งหมด (Danger Zone)</h3>
            <p className="text-sm text-gray-300">ลบข้อมูลคะแนนที่ให้แล้วทั้งหมด จะไม่สามารถกู้คืนได้</p>
          </div>
          <button 
            onClick={handleResetScores}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
          >
            ล้างคะแนนทั้งหมด
          </button>
        </section>
      </main>
    </div>
  );
}
