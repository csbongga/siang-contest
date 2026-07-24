'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Unlock, Edit3, Trash2, AlertCircle, Save, X } from 'lucide-react';

export default function AdminScoresPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialTeam = searchParams.get('team') || '';
  const initialJudge = searchParams.get('judge') || '';

  const [judges, setJudges] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam);
  const [selectedJudge, setSelectedJudge] = useState(initialJudge);

  const [scoreData, setScoreData] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetch('/api/judges').then(r => r.json()).then(d => setJudges(d.judges || []));
    fetch('/api/teams').then(r => r.json()).then(d => setTeams(d.teams || []));
  }, []);

  useEffect(() => {
    if (selectedTeam && selectedJudge) {
      fetchScore();
      // Update URL without reload
      const newUrl = `/admin/scores?team=${selectedTeam}&judge=${selectedJudge}`;
      window.history.pushState({}, '', newUrl);
    } else {
      setScoreData(null);
    }
  }, [selectedTeam, selectedJudge]);

  const fetchScore = async () => {
    setLoadingScore(true);
    setMessage(null);
    setIsEditing(false);
    try {
      const res = await fetch(`/api/scores?team_id=${selectedTeam}&judge_id=${selectedJudge}`);
      const data = await res.json();
      setScoreData(data.score || null);
      if (data.score) {
        setEditForm({ ...data.score });
      } else {
        setEditForm({ c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0, note: '' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScore(false);
    }
  };

  const handleAction = async (action: 'unlock' | 'edit' | 'delete', data?: any) => {
    if (!reason) {
      setMessage({ type: 'error', text: 'กรุณาระบุเหตุผลการแก้ไข' });
      return;
    }
    
    if (action === 'delete' && !confirm('ยืนยันการลบคะแนน?')) return;

    setMessage(null);
    try {
      const endpoint = `/api/admin/scores/${action}`;
      const payload = {
        judge_id: selectedJudge,
        team_id: selectedTeam,
        reason,
        ...(data || {})
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'ดำเนินการสำเร็จ' });
        setReason('');
        setIsEditing(false);
        fetchScore();
      } else {
        setMessage({ type: 'error', text: resData.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction('edit', editForm);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold text-gold">จัดการคะแนนรายบุคคล</h1>
        <p className="text-gray-300 mt-1">ปลดล็อก แก้ไข ลบ หรือกรอกคะแนนแทนกรรมการ</p>
      </div>

      <div className="bg-cream p-6 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 mb-2">เลือกทีม</label>
          <select 
            className="w-full p-3 rounded-lg border border-gray-300 text-aubergine"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">-- เลือกทีม --</option>
            {teams.map(t => <option key={t.id} value={t.id}>[{t.id}] {t.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 mb-2">เลือกกรรมการ</label>
          <select 
            className="w-full p-3 rounded-lg border border-gray-300 text-aubergine"
            value={selectedJudge}
            onChange={(e) => setSelectedJudge(e.target.value)}
          >
            <option value="">-- เลือกกรรมการ --</option>
            {judges.map(j => <option key={j.id} value={j.id}>[{j.id}] {j.name}</option>)}
          </select>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <AlertCircle />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {selectedTeam && selectedJudge && !loadingScore && (
        <div className="bg-white rounded-2xl p-6 shadow-xl text-aubergine border border-gray-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="font-display text-xl font-bold">ข้อมูลคะแนน</h3>
            {scoreData ? (
              <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${scoreData.is_locked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {scoreData.is_locked ? <><Lock size={16} /> ล็อกผลแล้ว</> : <><Unlock size={16} /> ปลดล็อกแล้ว</>}
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                ยังไม่ส่งคะแนน
              </span>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              {scoreData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C1 (20)</div>
                    <div className="text-2xl font-bold">{scoreData.c1}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C2 (20)</div>
                    <div className="text-2xl font-bold">{scoreData.c2}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C3 (15)</div>
                    <div className="text-2xl font-bold">{scoreData.c3}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C4 (15)</div>
                    <div className="text-2xl font-bold">{scoreData.c4}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C5 (15)</div>
                    <div className="text-2xl font-bold">{scoreData.c5}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C6 (10)</div>
                    <div className="text-2xl font-bold">{scoreData.c6}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">C7 (5)</div>
                    <div className="text-2xl font-bold">{scoreData.c7}</div>
                  </div>
                  <div className="bg-pink/10 p-4 rounded-xl border border-pink/20">
                    <div className="text-xs text-pink">รวม</div>
                    <div className="text-2xl font-black text-pink">
                      {scoreData.c1 + scoreData.c2 + scoreData.c3 + scoreData.c4 + scoreData.c5 + scoreData.c6 + scoreData.c7}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-4 bg-gray-50 p-4 rounded-xl border">
                    <div className="text-xs text-gray-500">หมายเหตุ</div>
                    <div className="text-sm mt-1">{scoreData.note || '-'}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  กรรมการท่านนี้ยังไม่ได้ส่งคะแนนให้ทีมนี้
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-6">
                <label className="block text-sm font-bold text-blue-900 mb-2">เหตุผลการดำเนินการ (ต้องระบุ)</label>
                <input 
                  type="text" 
                  className="w-full p-2 rounded border border-blue-300 text-sm"
                  placeholder="เช่น กรรมการขอกดส่งใหม่, พิมพ์ผิด, ฯลฯ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                {scoreData && scoreData.is_locked && (
                  <button onClick={() => handleAction('unlock')} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                    <Unlock size={18} /> ปลดล็อกให้กรรมการแก้เอง
                  </button>
                )}
                <button onClick={() => setIsEditing(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                  <Edit3 size={18} /> {scoreData ? 'แอดมินแก้ไขคะแนน' : 'แอดมินกรอกคะแนนแทน'}
                </button>
                {scoreData && (
                  <button onClick={() => handleAction('delete')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2">
                    <Trash2 size={18} /> ลบคะแนนนี้ทิ้ง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'c1', max: 20, label: 'C1' },
                  { id: 'c2', max: 20, label: 'C2' },
                  { id: 'c3', max: 15, label: 'C3' },
                  { id: 'c4', max: 15, label: 'C4' },
                  { id: 'c5', max: 15, label: 'C5' },
                  { id: 'c6', max: 10, label: 'C6' },
                  { id: 'c7', max: 5, label: 'C7' },
                ].map(c => (
                  <div key={c.id}>
                    <label className="block text-xs font-bold text-gray-500 mb-1">{c.label} (เต็ม {c.max})</label>
                    <input 
                      type="number" 
                      min="0" max={c.max} 
                      className="w-full p-2 rounded border border-gray-300 text-lg font-bold text-center"
                      value={editForm[c.id]}
                      onChange={(e) => setEditForm({...editForm, [c.id]: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1">หมายเหตุ</label>
                  <textarea 
                    className="w-full p-2 rounded border border-gray-300 text-sm"
                    rows={2}
                    value={editForm.note}
                    onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                <label className="block text-sm font-bold text-blue-900 mb-2">เหตุผลการดำเนินการ (ต้องระบุ)</label>
                <input 
                  type="text" 
                  className="w-full p-2 rounded border border-blue-300 text-sm"
                  placeholder="เช่น กรรมการฝากแก้, กรอกคะแนนจากกระดาษ"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <X size={18} /> ยกเลิก
                </button>
                <button type="submit" className="flex-1 bg-pink hover:bg-pink/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                  <Save size={18} /> บันทึกการแก้ไข
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
