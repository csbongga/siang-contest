'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Music, Award } from 'lucide-react';

export default function AdminAnnouncePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [jRes, tRes, sRes, socRes] = await Promise.all([
        fetch('/api/judges'), fetch('/api/teams'), fetch('/api/scores?all=true'), fetch('/api/social')
      ]);
      const [j, t, s, soc] = await Promise.all([
        jRes.json(), tRes.json(), sRes.json(), socRes.json()
      ]);
      
      const teams = t.teams || [];
      const scores = s.scores || [];
      const socials = soc.social_votes || [];

      // 1. คำนวณคะแนนกรรมการ (80%)
      const teamScore1: Record<string, number> = {};
      for (const team of teams) {
        const teamScores = scores.filter((ts: any) => ts.team_id === team.id);
        if (teamScores.length > 0) {
          const sumOfSums = teamScores.reduce((acc: number, ts: any) => acc + ts.c1 + ts.c2 + ts.c3 + ts.c4 + ts.c5 + ts.c6 + ts.c7, 0);
          teamScore1[team.id] = (sumOfSums / teamScores.length) * 0.8;
        } else {
          teamScore1[team.id] = 0;
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

      const finalResults = teams.map((team: any) => {
        const s1 = teamScore1[team.id] || 0;
        const s2 = teamScore2[team.id] || 0;
        return {
          id: team.id,
          name: team.name,
          total: s1 + s2
        };
      });

      finalResults.sort((a, b) => b.total - a.total);
      
      // Calculate Popular Vote
      const popVoteResults = teams.map(team => {
        const socData = socials.find(s => s.team_id === team.id) || { likes: 0, comments: 0, shares: 0 };
        return {
          id: team.id,
          name: team.name,
          popularVote: (socData.likes * 1) + (socData.comments * 2) + (socData.shares * 3)
        };
      });
      popVoteResults.sort((a, b) => b.popularVote - a.popularVote);

      setData({
        champion: finalResults[0],
        runnerUp1: finalResults[1],
        runnerUp2: finalResults[2],
        consolation1: finalResults[3],
        consolation2: finalResults[4],
        popularVote: popVoteResults[0]
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !data) {
    return <div className="min-h-screen bg-[#1E0B2E] flex items-center justify-center text-white text-3xl font-display animate-pulse">กำลังประมวลผลประกาศ...</div>;
  }

  return (
    <div className="fixed inset-0 bg-[#1E0B2E] overflow-y-auto z-50 text-white">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 30%, #E5197A 0%, transparent 40%), radial-gradient(circle at 80% 70%, #F5B301 0%, transparent 40%)',
        backgroundSize: '100% 100%'
      }} />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-8 max-w-6xl mx-auto">
        
        <header className="text-center mb-16 animate-fade-in-down">
          <h2 className="text-pink text-2xl font-bold tracking-widest uppercase mb-2 flex items-center justify-center gap-3">
            <Music size={24} /> ผลการประกวดวงดนตรีพื้นบ้าน <Music size={24} />
          </h2>
          <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-200 drop-shadow-lg">
            เสียงอยู่ไส Contest
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mb-12">
          
          {/* รองชนะเลิศอันดับ 1 */}
          <div className="lg:mt-16 transform hover:scale-105 transition-transform duration-500 order-2 lg:order-1 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-gray-300/30 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-300"></div>
              <Trophy size={64} className="text-gray-300 mx-auto mb-4 drop-shadow-md" />
              <h3 className="text-gray-300 text-xl font-bold mb-2">รางวัลรองชนะเลิศอันดับ 1</h3>
              {data.runnerUp1 && (
                <>
                  <div className="text-3xl font-display font-bold text-white mb-2">{data.runnerUp1.name}</div>
                  <div className="text-gray-400 font-medium">[{data.runnerUp1.id}]</div>
                </>
              )}
            </div>
          </div>

          {/* ชนะเลิศ */}
          <div className="transform hover:scale-105 transition-transform duration-500 order-1 lg:order-2 z-10 animate-fade-in-up">
            <div className="bg-gradient-to-b from-yellow-500/20 to-yellow-600/40 backdrop-blur-md rounded-3xl p-10 border-2 border-yellow-400/50 text-center relative overflow-hidden shadow-[0_0_50px_rgba(245,179,1,0.3)]">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-300 via-gold to-yellow-300"></div>
              <div className="absolute -top-10 -right-10 text-yellow-500/20 rotate-12">
                <Trophy size={200} />
              </div>
              <Trophy size={96} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] relative z-10" />
              <h3 className="text-yellow-400 text-2xl font-black mb-4 uppercase tracking-widest relative z-10">รางวัลชนะเลิศ</h3>
              {data.champion && (
                <>
                  <div className="text-5xl font-display font-black text-white mb-3 drop-shadow-lg relative z-10">{data.champion.name}</div>
                  <div className="text-yellow-200 text-xl font-bold relative z-10">[{data.champion.id}]</div>
                </>
              )}
            </div>
          </div>

          {/* รองชนะเลิศอันดับ 2 */}
          <div className="lg:mt-24 transform hover:scale-105 transition-transform duration-500 order-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-orange-400/30 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-400"></div>
              <Trophy size={56} className="text-orange-400 mx-auto mb-4 drop-shadow-md" />
              <h3 className="text-orange-400 text-lg font-bold mb-2">รางวัลรองชนะเลิศอันดับ 2</h3>
              {data.runnerUp2 && (
                <>
                  <div className="text-2xl font-display font-bold text-white mb-2">{data.runnerUp2.name}</div>
                  <div className="text-orange-200 font-medium">[{data.runnerUp2.id}]</div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* รางวัลอื่นๆ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center">
            <Award size={32} className="text-blue-400 mx-auto mb-3" />
            <h4 className="text-blue-300 font-bold mb-2">รางวัลชมเชย</h4>
            {data.consolation1 && <div className="text-xl font-display font-bold text-white">{data.consolation1.name}</div>}
          </div>

          <div className="bg-pink/20 backdrop-blur-md rounded-2xl p-6 border border-pink/30 text-center shadow-[0_0_30px_rgba(229,25,122,0.2)]">
            <Star size={40} className="text-pink mx-auto mb-3 fill-current drop-shadow-md" />
            <h4 className="text-pink-300 font-bold mb-2 text-lg">รางวัล Popular Vote</h4>
            {data.popularVote && <div className="text-2xl font-display font-bold text-white">{data.popularVote.name}</div>}
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center">
            <Award size={32} className="text-blue-400 mx-auto mb-3" />
            <h4 className="text-blue-300 font-bold mb-2">รางวัลชมเชย</h4>
            {data.consolation2 && <div className="text-xl font-display font-bold text-white">{data.consolation2.name}</div>}
          </div>

        </div>
        
        <div className="mt-12 text-center">
           <button 
             onClick={() => window.location.href = '/admin'}
             className="px-6 py-2 rounded-full border border-white/20 text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm"
           >
             กลับสู่หน้าผู้ดูแลระบบ
           </button>
        </div>

      </div>
    </div>
  );
}
