'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ScoreSliderProps {
  label: string;
  description?: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function ScoreSlider({ label, description, value, max, onChange }: ScoreSliderProps) {
  const handleDecrease = () => onChange(Math.max(0, value - 1));
  const handleIncrease = () => onChange(Math.min(max, value + 1));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="bg-cream p-4 rounded-xl shadow-sm text-aubergine">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-display font-semibold text-lg leading-tight">{label}</h4>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <div className="font-display text-2xl font-bold text-pink whitespace-nowrap ml-4">
          {value} <span className="text-gray-400 text-lg">/ {max}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-4">
        <button 
          type="button"
          onClick={handleDecrease}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-aubergine hover:bg-gray-200 active:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-pink"
          disabled={value <= 0}
        >
          <Minus size={24} />
        </button>
        
        <input 
          type="range" 
          min="0" 
          max={max} 
          value={value} 
          onChange={handleChange}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink"
        />
        
        <button 
          type="button"
          onClick={handleIncrease}
          className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-aubergine hover:bg-gray-200 active:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-pink"
          disabled={value >= max}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
