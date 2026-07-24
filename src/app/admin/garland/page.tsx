'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function AdminGarlandPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [socialData, setSocialData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, sRes, stateRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/social'),
        fetch('/api/admin/finalize')
      ]);
      const t = await tRes.json();
      const s = await sRes.json();
      const state = await stateRes.json();

      setTeams(t.teams || []);
      setIsFinalized(state.state?.is_finalized || false);

      const initialData: Record<string, any> = {};
      (t.teams || []).forEach((team: any) => {
        const existing = (s.social_votes || []).find((v: any) => v.team_id === team.id);
        initialData[team.id] = existing || { garlands: 0, likes: 0, comments: 0, shares: 0 };
      });
      setSocialData(initialData);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'โหลดข้อมูลล้มเหลว' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (teamId: string, field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setSocialData(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: numValue
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = teams.map(t => ({
        team_id: t.id,
        garlands: socialData[t.id].garlands,
        likes: socialData[t.id].likes,
        comments: socialData[t.id].comments,
        shares: socialData[t.id].shares,
      }));

      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes: payload })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'บันทึกคะแนนโซเชียลสำเร็จ!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'บันทึกล้มเหลว' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse font-display text-2xl">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold">กรอกคะแนนพวงมาลัย</h1>
          <p className="text-gray-300 mt-1">คะแนนพวงมาลัยหน้างาน</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || isFinalized}
          className="bg-pink hover:bg-pink/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-colors"
        >
          <Save size={20} /> {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
        </button>
      </div>

      {isFinalized && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle /> ระบบถูกล็อกผลแล้ว ไม่สามารถแก้ไขคะแนนได้
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <AlertCircle />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden text-aubergine">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-center">
                <th className="p-4 font-bold text-left">ทีม</th>
                <th className="p-4 font-bold bg-yellow-50 text-yellow-800 border-l border-r border-gray-200">
                  พวงมาลัย<br/><span className="text-xs font-normal">(คิด 20% อันดับ 1 ได้ 20)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const s = socialData[t.id] || { garlands: 0, likes: 0, comments: 0, shares: 0 };
                const popScore = (s.likes * 1) + (s.comments * 2) + (s.shares * 3);

                return (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium md:sticky md:left-0 bg-white group-hover:bg-gray-50 md:z-10">
                      <span className="text-xs text-pink mr-2">[{t.id}]</span>
                      {t.name}
                    </td>
                    <td className="p-4 border-l border-r border-gray-100 bg-yellow-50/30">
                      <input 
                        type="number" min="0"
                        className="w-full p-2 text-center rounded border border-gray-300 focus:ring-2 focus:ring-yellow-400"
                        value={s.garlands || ''}
                        onChange={(e) => handleInputChange(t.id, 'garlands', e.target.value)}
                        disabled={isFinalized}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
