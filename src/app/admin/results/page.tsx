'use client';

import { useState, useEffect } from 'react';
import { Trophy, Lock, Unlock, AlertCircle, Heart } from 'lucide-react';

export default function AdminResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchData = async () => {
    try {
      const [jRes, tRes, sRes, socRes, stateRes] = await Promise.all([
        fetch('/api/judges'), fetch('/api/teams'), fetch('/api/scores?all=true'), fetch('/api/social'), fetch('/api/admin/finalize')
      ]);
      const [j, t, s, soc, state] = await Promise.all([
        jRes.json(), tRes.json(), sRes.json(), socRes.json(), stateRes.json()
      ]);
      
      processResults(t.teams || [], j.judges || [], s.scores || [], soc.social_votes || [], state.state || { is_finalized: false });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const processResults = (teams: any[], judges: any[], scores: any[], socials: any[], state: any) => {
    // 1. คำนวณคะแนนกรรมการ (80%)
    const teamScore1: Record<string, number> = {};
    for (const t of teams) {
      const teamScores = scores.filter((s: any) => s.team_id === t.id);
      if (teamScores.length > 0) {
        const sumOfSums = teamScores.reduce((acc: number, s: any) => acc + s.c1 + s.c2 + s.c3 + s.c4 + s.c5 + s.c6 + s.c7, 0);
        const avgScore = sumOfSums / teamScores.length;
        teamScore1[t.id] = avgScore * 0.8;
      } else {
        teamScore1[t.id] = 0;
      }
    }

    // 2. คำนวณคะแนนพวงมาลัย (20%)
    const socialRanked = [...socials].sort((a, b) => b.garlands - a.garlands);
    const teamScore2: Record<string, number> = {};
    let currentRank = 1;
    let currentScore = 20;

    for (let i = 0; i < socialRanked.length; i++) {
      if (i > 0 && socialRanked[i].garlands < socialRanked[i-1].garlands) {
        currentRank = i + 1;
        currentScore = 20 - (currentRank - 1);
        if (currentScore < 10) currentScore = 10;
      }
      teamScore2[socialRanked[i].team_id] = currentScore;
    }

    const finalResults = teams.map(t => {
      const s1 = teamScore1[t.id] || 0;
      const s2 = teamScore2[t.id] || 0;
      const soc = socials.find(s => s.team_id === t.id) || { likes: 0, comments: 0, shares: 0 };
      const popularVote = (soc.likes * 1) + (soc.comments * 2) + (soc.shares * 3);

      return {
        id: t.id,
        name: t.name,
        score1: s1,
        score2: s2,
        total: s1 + s2,
        popularVote
      };
    });

    finalResults.sort((a, b) => b.total - a.total);
    
    // เรียง Popular Vote แยกลำดับ
    const popVoteResults = [...finalResults].sort((a, b) => b.popularVote - a.popularVote);

    setData({ results: finalResults, popularResults: popVoteResults, state, isAllComplete: scores.length === teams.length * judges.length });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFinalize = async (finalize: boolean) => {
    if (finalize && !confirm('ยืนยันการล็อกผลการแข่งขัน? เมื่อล็อกแล้ว กรรมการและแอดมินจะไม่สามารถแก้ไขคะแนนได้อีก')) return;
    if (!finalize && !confirm('ยืนยันการปลดล็อก?')) return;

    setIsFinalizing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_finalized: finalize })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: finalize ? 'ล็อกผลการแข่งขันเรียบร้อย' : 'ปลดล็อกเรียบร้อย' });
        fetchData();
      } else {
        const d = await res.json();
        setMessage({ type: 'error', text: d.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading || !data) {
    return <div className="text-center py-20 animate-pulse font-display text-2xl">กำลังประมวลผลคะแนน...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold">สรุปผลการแข่งขัน</h1>
          <p className="text-gray-300 mt-1">คะแนนรวมจากกรรมการ (80%) และพวงมาลัย (20%)</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {message && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <button
            onClick={() => handleFinalize(!data.state.is_finalized)}
            disabled={isFinalizing || (!data.state.is_finalized && !data.isAllComplete)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              data.state.is_finalized 
                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {data.state.is_finalized ? (
              <><Unlock size={20} /> ปลดล็อกผลคะแนน</>
            ) : (
              <><Lock size={20} /> ล็อกผลการแข่งขัน (Finalize)</>
            )}
          </button>
          {!data.state.is_finalized && !data.isAllComplete && (
            <p className="text-xs text-orange-400">ยังไม่สามารถล็อกได้ เนื่องจากกรรมการส่งคะแนนไม่ครบ</p>
          )}
        </div>
      </div>

      <div className="bg-cream rounded-2xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-aubergine text-white">
                <th className="p-4 border-b border-white/20 font-bold rounded-tl-xl w-20 text-center">อันดับ</th>
                <th className="p-4 border-b border-white/20 font-bold">ทีม</th>
                <th className="p-4 border-b border-white/20 font-bold text-right w-40">ส่วนที่ 1 (80%)</th>
                <th className="p-4 border-b border-white/20 font-bold text-right w-40">ส่วนที่ 2 (20%)</th>
                <th className="p-4 border-b border-white/20 font-bold text-right w-40 rounded-tr-xl">คะแนนรวม</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r: any, idx: number) => {
                let rowStyle = 'hover:bg-gray-50 bg-white';
                let rankTrophy = null;
                
                if (idx === 0) { rowStyle = 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-bold'; rankTrophy = <Trophy className="text-yellow-500 mx-auto" />; }
                else if (idx === 1) { rowStyle = 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold'; rankTrophy = <Trophy className="text-gray-400 mx-auto" />; }
                else if (idx === 2) { rowStyle = 'bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold'; rankTrophy = <Trophy className="text-orange-500 mx-auto" />; }
                else if (idx === 3) { rowStyle = 'bg-pink/5 hover:bg-pink/10 font-bold'; } // ชมเชย 1
                else if (idx === 4) { rowStyle = 'bg-pink/5 hover:bg-pink/10 font-bold'; } // ชมเชย 2

                return (
                  <tr key={r.id} className={`border-b border-gray-200 transition-colors ${rowStyle}`}>
                    <td className="p-4 text-center text-lg">{rankTrophy || idx + 1}</td>
                    <td className="p-4 text-lg">
                      <span className="text-sm text-pink mr-2">[{r.id}]</span> {r.name}
                    </td>
                    <td className="p-4 text-right font-medium">{r.score1.toFixed(2)}</td>
                    <td className="p-4 text-right font-medium">{r.score2.toFixed(2)}</td>
                    <td className="p-4 text-right text-xl font-black text-aubergine">{r.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-pink to-purple-600 rounded-2xl p-6 shadow-xl text-white">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="fill-current" /> รางวัล Popular Vote
          </h2>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            {data.popularResults.length > 0 && (
              <div className="text-center py-4">
                <div className="text-sm font-bold text-pink-200 mb-1">อันดับ 1</div>
                <div className="text-3xl font-black mb-2">{data.popularResults[0].name}</div>
                <div className="text-lg">คะแนนความนิยม: <span className="font-bold text-yellow-300">{data.popularResults[0].popularVote}</span> คะแนน</div>
                <div className="text-xs text-white/70 mt-2">(คำนวณจาก Like x1, Comment x2, Share x3)</div>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {data.popularResults.slice(1, 4).map((r: any, idx: number) => (
              <div key={r.id} className="flex justify-between items-center text-sm border-b border-white/20 pb-2">
                <span>{idx + 2}. {r.name}</span>
                <span className="font-bold">{r.popularVote} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
