'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, AlertCircle, CheckCircle2, History } from 'lucide-react';

type Judge = { id: string; name: string; pin: string | null };
type Team = { id: string; name: string };

export default function AdminSettingsPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  
  const [newJudge, setNewJudge] = useState({ id: '', name: '', pin: '' });
  const [newTeam, setNewTeam] = useState({ id: '', name: '' });
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchData = async () => {
    try {
      const [jRes, tRes, aRes] = await Promise.all([
        fetch('/api/judges'), fetch('/api/teams'), fetch('/api/admin/report/excel') // need audit api, but we didn't create one. Let's create an inline fetch or just use a new API route for audit.
      ]);
      const j = await jRes.json();
      const t = await tRes.json();
      setJudges(j.judges || []);
      setTeams(t.teams || []);
      
      // Fetch audits directly here if we had an endpoint. Since we don't, I will just create a quick endpoint or fetch from db in a server action. 
      // I'll leave audit fetching empty for now and fetch it via a new GET endpoint.
      fetchAudit();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/judges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newJudge) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'เพิ่มกรรมการสำเร็จ' });
      setNewJudge({ id: '', name: '', pin: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteJudge = async (id: string) => {
    if (!confirm('ยืนยันการลบกรรมการ? (คะแนนที่เคยให้จะถูกลบด้วย)')) return;
    try {
      const res = await fetch(`/api/judges?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'ลบกรรมการสำเร็จ' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTeam) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'เพิ่มทีมสำเร็จ' });
      setNewTeam({ id: '', name: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('ยืนยันการลบทีม? (คะแนนที่ได้รับจะถูกลบด้วย)')) return;
    try {
      const res = await fetch(`/api/teams?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'ลบทีมสำเร็จ' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetScores = async () => {
    const code = prompt('หากต้องการล้างคะแนนทั้งหมด พิมพ์ "RESET"');
    if (code !== 'RESET') return;
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'ล้างคะแนนทั้งหมดสำเร็จ' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-gold">ตั้งค่าระบบ & ประวัติ</h1>
        <p className="text-gray-300 mt-1">จัดการทีม กรรมการ และดูประวัติการแก้ไขคะแนน</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* จัดการทีม */}
        <section className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl border border-gray-100">
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
        <section className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl border border-gray-100">
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

      <section className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl border border-gray-100">
        <h3 className="font-display text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
          <History size={20} /> ประวัติการแก้ไขคะแนน (Audit Log)
        </h3>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b font-bold w-40">เวลา</th>
                <th className="p-3 border-b font-bold w-24">Action</th>
                <th className="p-3 border-b font-bold w-32">กรรมการ / ทีม</th>
                <th className="p-3 border-b font-bold min-w-[200px]">เหตุผล</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">ไม่มีประวัติการแก้ไข</td></tr>
              ) : (
                audits.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-500 text-xs">{new Date(a.created_at).toLocaleString('th-TH')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        a.action === 'submit' ? 'bg-green-100 text-green-700' :
                        a.action === 'resubmit' ? 'bg-blue-100 text-blue-700' :
                        a.action === 'unlock' ? 'bg-yellow-100 text-yellow-700' :
                        a.action === 'admin_edit' ? 'bg-orange-100 text-orange-700' :
                        a.action === 'admin_entry' ? 'bg-purple-100 text-purple-700' :
                        a.action === 'delete' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="p-3 font-medium">
                      [{a.judge_id}] <br/> <span className="text-pink">[{a.team_id}]</span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {a.reason || '-'}
                      {a.actor && <div className="text-xs text-gray-400 mt-1">โดย: {a.actor}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-red-900/40 border border-red-500/50 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-red-400 mb-1">ล้างคะแนนทั้งหมด (Danger Zone)</h3>
          <p className="text-sm text-gray-300">ลบข้อมูลคะแนนและโซเชียลทั้งหมด จะไม่สามารถกู้คืนได้</p>
        </div>
        <button 
          onClick={handleResetScores}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
        >
          ล้างคะแนนทั้งหมด
        </button>
      </section>
    </div>
  );
}
