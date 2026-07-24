'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ScoreSlider } from '@/components/ScoreSlider';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type Judge = { id: string; name: string; pin: string | null };
type Team = { id: string; name: string };

export default function JudgePage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [selectedJudge, setSelectedJudge] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [judgeVerified, setJudgeVerified] = useState(false);
  
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [scoredTeams, setScoredTeams] = useState<string[]>([]);
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  
  const [scores, setScores] = useState({ c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0 });
  const [note, setNote] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    fetch('/api/judges').then(res => res.json()).then(data => setJudges(data.judges || []));
    fetch('/api/teams').then(res => res.json()).then(data => setTeams(data.teams || []));
  }, []);

  useEffect(() => {
    if (judgeVerified && selectedJudge) {
      fetch(`/api/scores?judge_id=${selectedJudge}`)
        .then(res => res.json())
        .then(data => {
          setScoredTeams(data.scored_teams || []);
          setLocks(data.locks || {});
        });
    }
  }, [judgeVerified, selectedJudge]);

  useEffect(() => {
    if (judgeVerified && selectedJudge && selectedTeam) {
      // ดึงคะแนนเดิมมาแสดง
      fetch(`/api/scores?judge_id=${selectedJudge}&team_id=${selectedTeam}`)
        .then(res => res.json())
        .then(data => {
          if (data.score) {
            setScores({
              c1: data.score.c1, c2: data.score.c2, c3: data.score.c3,
              c4: data.score.c4, c5: data.score.c5, c6: data.score.c6, c7: data.score.c7
            });
            setNote(data.score.note || '');
          } else {
            setScores({ c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0 });
            setNote('');
          }
          setMessage(null);
        });
    }
  }, [judgeVerified, selectedJudge, selectedTeam]);

  const totalDancer = scores.c1 + scores.c2 + scores.c3 + scores.c4;
  const totalSinger = scores.c5 + scores.c6 + scores.c7;
  const grandTotal = totalDancer + totalSinger;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const judge = judges.find(j => j.id === selectedJudge);
    if (!judge) return;
    
    if (judge.pin && judge.pin !== pinInput) {
      setMessage({ type: 'error', text: 'PIN ไม่ถูกต้อง' });
      return;
    }
    setJudgeVerified(true);
    setMessage(null);
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judge_id: selectedJudge,
          team_id: selectedTeam,
          ...scores,
          note
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'บันทึกคะแนนเรียบร้อยแล้ว!' });
        if (!scoredTeams.includes(selectedTeam)) {
          setScoredTeams([...scoredTeams, selectedTeam]);
        }
        setLocks({ ...locks, [selectedTeam]: true });
        // ซ่อนกล่องเด้งหลังจาก 3 วินาที
        setTimeout(() => {
          setMessage(null);
          setSelectedTeam('');
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'การเชื่อมต่อผิดพลาด' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="pb-24">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 py-8">
        {!judgeVerified ? (
          <div className="bg-cream text-aubergine p-6 rounded-2xl shadow-xl">
            <h2 className="font-display text-2xl font-bold mb-6 text-center text-pink">เข้าสู่ระบบกรรมการ</h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">เลือกชื่อกรรมการ</label>
                <select 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink focus:border-pink bg-white"
                  value={selectedJudge}
                  onChange={(e) => setSelectedJudge(e.target.value)}
                  required
                >
                  <option value="">-- กรุณาเลือก --</option>
                  {judges.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedJudge && judges.find(j => j.id === selectedJudge)?.pin && (
                <div>
                  <label className="block text-sm font-semibold mb-2">PIN ยืนยันตัวตน (4 หลัก)</label>
                  <input 
                    type="password"
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pink focus:border-pink"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {message?.type === 'error' && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} /> {message.text}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={!selectedJudge}
                className="w-full bg-pink hover:bg-pink/90 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                เข้าให้คะแนน
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl border border-white/20">
              <div>
                <p className="text-sm text-cyan">กรรมการ</p>
                <p className="font-display text-lg font-bold">{judges.find(j => j.id === selectedJudge)?.name}</p>
              </div>
              <button 
                onClick={() => { setJudgeVerified(false); setPinInput(''); setSelectedJudge(''); setSelectedTeam(''); }}
                className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                เปลี่ยนผู้ใช้
              </button>
            </div>

            <div className="bg-cream text-aubergine p-6 rounded-2xl shadow-xl">
              <label className="block text-lg font-display font-bold mb-3">เลือกทีมที่ต้องการให้คะแนน</label>
              <select 
                className="w-full p-4 text-lg rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink focus:border-pink bg-white shadow-sm font-bold"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">-- เลือกทีม --</option>
                {teams.map(t => {
                  const isLocked = locks[t.id];
                  return (
                    <option key={t.id} value={t.id} disabled={isLocked} className={isLocked ? "text-gray-400 bg-gray-100" : ""}>
                      {t.name} {isLocked ? ' 🔒 (ส่งคะแนนแล้ว)' : (scoredTeams.includes(t.id) ? ' (มีข้อมูลร่าง)' : '')}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedTeam && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {message?.type === 'success' && (
                  <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-10 fade-in duration-300">
                    <div className="bg-green-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 font-display font-bold text-xl border-4 border-white/30 backdrop-blur-sm">
                      <CheckCircle2 size={28} />
                      <span>{message.text}</span>
                    </div>
                  </div>
                )}
                
                <section>
                  <div className="flex justify-between items-baseline mb-4 border-b border-white/20 pb-2">
                    <h3 className="font-display text-2xl font-bold text-gold">A. การแสดงของ Dancer</h3>
                    <div className="text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{totalDancer} / 70</div>
                  </div>
                  <div className="space-y-4">
                    <ScoreSlider 
                      label="1. ความพร้อมเพรียงของทีมเต้น" 
                      description="ความแม่นยำของท่าเต้น • ความพร้อมเพรียง" 
                      value={scores.c1} max={20} onChange={(v) => setScores(s => ({...s, c1: v}))} 
                    />
                    <ScoreSlider 
                      label="2. ความสนุกสนานและสร้างบรรยากาศ" 
                      description="ความคึกคักของโชว์ • สร้างสีสันและความตื่นเต้น" 
                      value={scores.c2} max={20} onChange={(v) => setScores(s => ({...s, c2: v}))} 
                    />
                    <ScoreSlider 
                      label="3. ความคิดสร้างสรรค์" 
                      description="ออกแบบท่าเต้น • ใช้พื้นที่เวที • เอกลักษณ์ทีม" 
                      value={scores.c3} max={15} onChange={(v) => setScores(s => ({...s, c3: v}))} 
                    />
                    <ScoreSlider 
                      label="4. การแต่งกายและองค์ประกอบ" 
                      description="ความสวยงาม • เหมาะกับเพลง • อุปกรณ์" 
                      value={scores.c4} max={15} onChange={(v) => setScores(s => ({...s, c4: v}))} 
                    />
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-baseline mb-4 border-b border-white/20 pb-2 mt-12">
                    <h3 className="font-display text-2xl font-bold text-cyan">B. การแสดงของนักร้อง</h3>
                    <div className="text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{totalSinger} / 30</div>
                  </div>
                  <div className="space-y-4">
                    <ScoreSlider 
                      label="5. คุณภาพการร้องเพลง" 
                      description="น้ำเสียง • จังหวะ • ความถูกต้องของเนื้อร้อง" 
                      value={scores.c5} max={15} onChange={(v) => setScores(s => ({...s, c5: v}))} 
                    />
                    <ScoreSlider 
                      label="6. บุคลิกภาพและการสื่อสาร" 
                      description="เอนเตอร์เทนผู้ชม • ความมั่นใจ • มีส่วนร่วม" 
                      value={scores.c6} max={10} onChange={(v) => setScores(s => ({...s, c6: v}))} 
                    />
                    <ScoreSlider 
                      label="7. ความเหมาะสมของการเลือกเพลง" 
                      description="ความต่อเนื่องของโชว์ • สนุกและเร้าอารมณ์" 
                      value={scores.c7} max={5} onChange={(v) => setScores(s => ({...s, c7: v}))} 
                    />
                  </div>
                </section>

                <section className="bg-cream text-aubergine p-6 rounded-2xl shadow-xl">
                  <label className="block text-lg font-display font-bold mb-2">บันทึกเพิ่มเติม (Note)</label>
                  <textarea 
                    className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-pink focus:border-pink bg-white resize-none"
                    rows={3}
                    placeholder="ความเห็นเพิ่มเติมสำหรับทีมนี้..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </section>

                <div className="pt-6 pb-20">
                  <button 
                    onClick={handleConfirmClick}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink to-gold text-white font-display font-bold text-2xl py-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-aubergine rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-aubergine p-4 text-center">
              <h2 className="font-display font-bold text-2xl text-white">ยืนยันการบันทึกคะแนน</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-500">ทีมที่เลือก</p>
                <p className="font-display font-bold text-2xl text-pink">{teams.find(t => t.id === selectedTeam)?.name}</p>
              </div>
              
              <div className="space-y-2 text-lg">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">A. การแสดงของ Dancer</span>
                  <span className="font-bold text-gold">{totalDancer} / 70</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">B. การแสดงของนักร้อง</span>
                  <span className="font-bold text-cyan">{totalSinger} / 30</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">คะแนนรวมสุทธิ</span>
                  <span className="font-black text-2xl text-aubergine">{grandTotal} / 100</span>
                </div>
              </div>

              {note && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm italic text-gray-600 border border-gray-200">
                  <span className="font-bold not-italic">Note:</span> {note}
                </div>
              )}
            </div>
            
            <div className="flex p-4 gap-3 bg-gray-50">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 py-3 font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors shadow-md"
              >
                ยืนยันการบันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Total Score Bar */}
      {judgeVerified && selectedTeam && (
        <div className="fixed bottom-0 left-0 right-0 bg-aubergine/95 backdrop-blur-md border-t border-white/20 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-40 transform transition-transform">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <span className="font-display font-bold text-xl text-gray-200">คะแนนรวมสุทธิ</span>
            <div className="flex items-baseline gap-2">
              <span className={`font-display font-black text-4xl ${grandTotal > 80 ? 'text-gold' : 'text-white'}`}>
                {grandTotal}
              </span>
              <span className="text-gray-400 font-bold">/ 100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
