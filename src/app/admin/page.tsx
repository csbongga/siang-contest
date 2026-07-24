'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Lock, Unlock, Clock, AlertCircle } from 'lucide-react';

type Judge = { id: string; name: string };
type Team = { id: string; name: string };
type Score = { judge_id: string; team_id: string; is_locked: boolean; submitted_at: string };
type Social = { team_id: string };

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<{
    judges: Judge[], teams: Team[], scores: Score[], socials: Social[], state: any
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [jRes, tRes, sRes, socRes, stateRes] = await Promise.all([
        fetch('/api/judges'), fetch('/api/teams'), fetch('/api/scores?all=true'), fetch('/api/social'), fetch('/api/admin/finalize')
      ]);
      const [j, t, s, soc, state] = await Promise.all([
        jRes.json(), tRes.json(), sRes.json(), socRes.json(), stateRes.json()
      ]);
      
      setData({
        judges: j.judges || [],
        teams: t.teams || [],
        scores: s.scores || [],
        socials: soc.social_votes || [],
        state: state.state || { is_finalized: false }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh 10s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return <div className="text-center py-20 animate-pulse font-display text-2xl">กำลังโหลดข้อมูล...</div>;
  }

  const { judges, teams, scores, socials, state } = data;
  const totalExpected = teams.length * judges.length;
  const totalSubmitted = scores.length;
  const fullyScoredTeams = teams.filter(t => scores.filter(s => s.team_id === t.id).length === judges.length).length;
  const isAllSocialsEntered = socials.length === teams.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold">แดชบอร์ดสถานะ</h1>
          <p className="text-gray-300 mt-1">อัปเดตอัตโนมัติทุก 10 วินาที</p>
        </div>
        {state.is_finalized && (
          <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
            <Lock size={20} /> ระบบถูกล็อกผลแล้ว
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm">
          <p className="text-gray-300 text-sm font-bold mb-2">ส่งคะแนนกรรมการแล้ว</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-cyan">{totalSubmitted}</span>
            <span className="text-xl text-gray-400">/ {totalExpected} รายการ</span>
          </div>
        </div>
        <div className="bg-cream/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm">
          <p className="text-gray-300 text-sm font-bold mb-2">ทีมที่ได้คะแนนกรรมการครบ</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-pink">{fullyScoredTeams}</span>
            <span className="text-xl text-gray-400">/ {teams.length} ทีม</span>
          </div>
        </div>
        <div className="bg-cream/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm">
          <p className="text-gray-300 text-sm font-bold mb-2">สถานะคะแนนโซเชียล</p>
          <div className="flex items-baseline gap-2 mt-2">
            {isAllSocialsEntered ? (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-green-500/30">
                <CheckCircle2 size={16} /> กรอกครบทุกทีมแล้ว
              </span>
            ) : (
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-orange-500/30">
                <AlertTriangle size={16} /> ขาดอีก {teams.length - socials.length} ทีม
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {(totalSubmitted < totalExpected || !isAllSocialsEntered) && (
        <div className="bg-orange-900/40 border border-orange-500/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-orange-400">ยังไม่ควรประกาศผล</h4>
            <p className="text-sm text-gray-300 mt-1">
              ยังมีกรรมการส่งคะแนนไม่ครบ หรือยังกรอกคะแนนโซเชียลไม่ครบทุกทีม หากรีบประมวลผลอันดับอาจคลาดเคลื่อน
            </p>
          </div>
        </div>
      )}

      {/* Status Matrix */}
      <div className="bg-cream rounded-2xl p-6 text-aubergine shadow-xl overflow-x-auto">
        <h3 className="font-display text-xl font-bold mb-4">ตารางสถานะส่งคะแนน</h3>
        <table className="w-full text-sm text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border border-gray-200 font-bold whitespace-nowrap sticky left-0 bg-gray-100 z-10">ทีม / กรรมการ</th>
              {judges.map(j => (
                <th key={j.id} className="p-3 border border-gray-200 font-bold text-center">
                  <div className="text-xs text-blue-600">[{j.id}]</div>
                  {j.name}
                </th>
              ))}
              <th className="p-3 border border-gray-200 font-bold text-center bg-blue-50/50">
                โซเชียล & พวงมาลัย
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-3 border border-gray-200 font-medium sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                  <span className="text-xs text-blue-600 mr-1">[{t.id}]</span> {t.name}
                </td>
                {judges.map(j => {
                  const score = scores.find(s => s.team_id === t.id && s.judge_id === j.id);
                  let status = 'none';
                  if (score) {
                    status = score.is_locked ? 'locked' : 'unlocked';
                  }

                  return (
                    <td 
                      key={`${t.id}-${j.id}`} 
                      className="p-3 border border-gray-200 text-center cursor-pointer transition-colors hover:bg-pink/10"
                      onClick={() => router.push(`/admin/scores?team=${t.id}&judge=${j.id}`)}
                    >
                      {status === 'locked' && (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full" title="ส่งแล้ว">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                      {status === 'unlocked' && (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full" title="ปลดล็อกรอส่งใหม่">
                          <Unlock size={18} />
                        </div>
                      )}
                      {status === 'none' && (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full" title="ยังไม่ส่ง">
                          <Clock size={18} />
                        </div>
                      )}
                    </td>
                  );
                })}
                <td 
                  className="p-3 border border-gray-200 text-center cursor-pointer transition-colors hover:bg-blue-50 bg-blue-50/30"
                  onClick={() => router.push(`/admin/social`)}
                >
                  {socials.some(s => s.team_id === t.id) ? (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full" title="กรอกข้อมูลแล้ว">
                      <CheckCircle2 size={18} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full" title="ยังไม่กรอกข้อมูล">
                      <Clock size={18} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 flex gap-4 text-sm font-medium justify-center bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-green-600"><CheckCircle2 size={10} /></div> ส่งแล้ว (ล็อก)</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600"><Unlock size={10} /></div> ปลดล็อกรอส่งใหม่</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Clock size={10} /></div> ยังไม่ส่ง</div>
        </div>
      </div>
    </div>
  );
}
