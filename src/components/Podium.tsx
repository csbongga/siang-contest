import React from 'react';
import { Trophy } from 'lucide-react';

interface PodiumItemProps {
  teamName: string;
  score: number;
  rank: number;
}

export function Podium({ topTeams }: { topTeams: PodiumItemProps[] }) {
  if (!topTeams || topTeams.length === 0) return null;

  const first = topTeams.find(t => t.rank === 1);
  const second = topTeams.find(t => t.rank === 2);
  const third = topTeams.find(t => t.rank === 3);

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 mt-8 mb-12 h-64">
      {/* 2nd Place */}
      {second && (
        <div className="flex flex-col items-center w-1/3 max-w-[120px]">
          <div className="text-center mb-2 px-1">
            <p className="font-display font-bold text-sm sm:text-base text-gray-700 line-clamp-2 leading-tight">{second.teamName}</p>
            <p className="text-gold font-bold">{second.score.toFixed(2)}</p>
          </div>
          <div className="w-full h-32 bg-gradient-to-t from-gray-700 to-gray-500 rounded-t-lg flex justify-center pt-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5"></div>
            <span className="font-display font-black text-3xl text-gray-300 drop-shadow-md">2</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {first && (
        <div className="flex flex-col items-center w-1/3 max-w-[140px] z-10">
          <div className="text-center mb-2 px-1 animate-bounce-slow">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-gold mx-auto mb-1 drop-shadow-glow" />
            <p className="font-display font-bold text-base sm:text-lg text-aubergine line-clamp-2 leading-tight">{first.teamName}</p>
            <p className="text-gold font-bold text-lg">{first.score.toFixed(2)}</p>
          </div>
          <div className="w-full h-40 bg-gradient-to-t from-gold/60 to-gold rounded-t-lg flex justify-center pt-2 shadow-[0_0_15px_rgba(245,179,1,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20"></div>
            <span className="font-display font-black text-4xl text-white drop-shadow-md">1</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {third && (
        <div className="flex flex-col items-center w-1/3 max-w-[120px]">
          <div className="text-center mb-2 px-1">
            <p className="font-display font-bold text-sm sm:text-base text-orange-900 line-clamp-2 leading-tight">{third.teamName}</p>
            <p className="text-gold font-bold">{third.score.toFixed(2)}</p>
          </div>
          <div className="w-full h-24 bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-lg flex justify-center pt-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5"></div>
            <span className="font-display font-black text-3xl text-orange-300 drop-shadow-md">3</span>
          </div>
        </div>
      )}
    </div>
  );
}
