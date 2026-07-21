'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Podium } from '@/components/Podium';
import { Download } from 'lucide-react';

type Judge = { id: string; name: string };
type Team = { id: string; name: string };
type Score = {
  judge_id: string; team_id: string;
  c1: number; c2: number; c3: number; c4: number;
  c5: number; c6: number; c7: number;
  note: string;
};

type AggregatedResult = {
  teamId: string;
  teamName: string;
  avgTotal: number;
  avgC1: number; avgC2: number; avgC3: number; avgC4: number;
  avgC5: number; avgC6: number; avgC7: number;
  voteCount: number;
  rank: number;
};

export default function ResultsPage() {
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [totalJudges, setTotalJudges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [judgesRes, teamsRes, scoresRes] = await Promise.all([
          fetch('/api/judges'), fetch('/api/teams'), fetch('/api/scores?all=true')
        ]);
        const { judges } = await judgesRes.json();
        const { teams } = await teamsRes.json();
        const { scores } = await scoresRes.json();

        setTotalJudges(judges.length);

        const aggregated: AggregatedResult[] = teams.map((t: Team) => {
          const teamScores = scores.filter((s: Score) => s.team_id === t.id);
          const voteCount = teamScores.length;

          if (voteCount === 0) {
            return {
              teamId: t.id, teamName: t.name, avgTotal: 0,
              avgC1: 0, avgC2: 0, avgC3: 0, avgC4: 0, avgC5: 0, avgC6: 0, avgC7: 0,
              voteCount: 0, rank: 999
            };
          }

          const sum = (key: keyof Score) => teamScores.reduce((acc: number, s: any) => acc + (Number(s[key]) || 0), 0);
          const c1 = sum('c1') / voteCount;
          const c2 = sum('c2') / voteCount;
          const c3 = sum('c3') / voteCount;
          const c4 = sum('c4') / voteCount;
          const c5 = sum('c5') / voteCount;
          const c6 = sum('c6') / voteCount;
          const c7 = sum('c7') / voteCount;

          return {
            teamId: t.id, teamName: t.name,
            avgTotal: c1 + c2 + c3 + c4 + c5 + c6 + c7,
            avgC1: c1, avgC2: c2, avgC3: c3, avgC4: c4,
            avgC5: c5, avgC6: c6, avgC7: c7,
            voteCount, rank: 0
          };
        });

        // จัดอันดับ
        aggregated.sort((a, b) => b.avgTotal - a.avgTotal);
        
        let currentRank = 1;
        for (let i = 0; i < aggregated.length; i++) {
          if (i > 0 && aggregated[i].avgTotal < aggregated[i - 1].avgTotal) {
            currentRank = i + 1;
          }
          aggregated[i].rank = aggregated[i].voteCount > 0 ? currentRank : 999;
        }

        setResults(aggregated);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDownloadCSV = () => {
    // ใส่ BOM เพื่อให้ Excel อ่านภาษาไทยได้ถูกต้อง
    const BOM = '\uFEFF';
    const header = "อันดับ,ชื่อทีม,คะแนนรวม,กรรมการ(คน),C1(20),C2(20),C3(15),C4(15),C5(15),C6(10),C7(5)\n";
    
    const rows = results.map(r => {
      const row = [
        r.rank === 999 ? '-' : r.rank,
        `"${r.teamName}"`,
        r.avgTotal.toFixed(2),
        `${r.voteCount}/${totalJudges}`,
        r.avgC1.toFixed(2), r.avgC2.toFixed(2), r.avgC3.toFixed(2), r.avgC4.toFixed(2),
        r.avgC5.toFixed(2), r.avgC6.toFixed(2), r.avgC7.toFixed(2)
      ];
      return row.join(',');
    }).join('\n');

    const csvContent = BOM + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "contest_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const topTeams = results.filter(r => r.rank <= 3 && r.voteCount > 0).map(r => ({
    teamName: r.teamName,
    score: r.avgTotal,
    rank: r.rank
  }));

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="font-display text-3xl font-bold text-pink">สรุปผลคะแนน</h2>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-cyan hover:bg-cyan/90 text-aubergine font-bold py-2 px-6 rounded-xl transition-colors"
          >
            <Download size={20} />
            ดาวน์โหลด CSV
          </button>
        </div>

        {topTeams.length > 0 ? (
          <div className="bg-cream rounded-3xl p-6 shadow-xl mb-12">
            <h3 className="font-display text-xl font-bold text-aubergine text-center mb-6 border-b border-gray-200 pb-4">Top 3 อันดับสูงสุด</h3>
            <Podium topTeams={topTeams} />
          </div>
        ) : (
          <div className="bg-cream rounded-3xl p-8 text-center text-gray-500 mb-12">
            ยังไม่มีข้อมูลคะแนนเพียงพอสำหรับการจัดอันดับ
          </div>
        )}

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-aubergine text-white">
                  <th className="p-4 font-display text-center whitespace-nowrap">อันดับ</th>
                  <th className="p-4 font-display">ชื่อทีม</th>
                  <th className="p-4 font-display text-center whitespace-nowrap text-gold">รวม (100)</th>
                  <th className="p-4 font-display text-center whitespace-nowrap">ให้คะแนนแล้ว</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C1 (20)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C2 (20)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C3 (15)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C4 (15)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C5 (15)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C6 (10)</th>
                  <th className="p-4 text-center whitespace-nowrap text-sm text-gray-300">C7 (5)</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {results.map((r, i) => (
                  <tr key={r.teamId} className={`border-b border-gray-200 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="p-4 text-center font-bold">
                      {r.rank === 999 ? '-' : r.rank}
                    </td>
                    <td className="p-4 font-bold">{r.teamName}</td>
                    <td className="p-4 text-center font-bold text-pink text-lg">{r.avgTotal.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.voteCount === totalJudges ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.voteCount} / {totalJudges}
                      </span>
                    </td>
                    <td className="p-4 text-center">{r.avgC1.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC2.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC3.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC4.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC5.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC6.toFixed(2)}</td>
                    <td className="p-4 text-center">{r.avgC7.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
