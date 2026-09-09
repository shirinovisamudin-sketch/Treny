import React from 'react';
import { SPORTS_REGISTRY, SportType } from '../types/sports';
import { ArrowRight, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react';

interface SportSelectionScreenProps {
  onSelectSport: (sport: SportType) => void;
  isDark: boolean;
  selectedSport?: SportType | null;
  onCancel?: () => void;
}

export function SportSelectionScreen({
  onSelectSport,
  isDark,
  selectedSport,
  onCancel
}: SportSelectionScreenProps) {
  const sports = Object.values(SPORTS_REGISTRY);

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-300 ${
      isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
        
        {/* Header Title */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Персональная спортивная среда
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Каким видом спорта вы занимаетесь?
          </h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Выберите вашу ключевую дисциплину. Интерфейс, таймеры, счетчики и звуки полностью адаптируются под ваши тренировки.
          </p>
        </div>

        {/* 5 Distinct Sport Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sports.map((sport) => {
            const isCurrent = selectedSport === sport.id;

            return (
              <div
                key={sport.id}
                onClick={() => onSelectSport(sport.id)}
                className={`group relative p-6 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-xl ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-500/10 ring-2 ring-primary-500/30'
                    : isDark
                    ? 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Header card info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl select-none group-hover:scale-110 transition-transform">
                      {sport.emoji}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: sport.accentColor }}
                      title={`Акцентный цвет: ${sport.accentColor}`}
                    />
                  </div>

                  <h3 className="text-xl font-black tracking-tight mb-1 group-hover:text-primary-500 transition-colors">
                    {sport.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mb-4 leading-relaxed line-clamp-2">
                    {sport.tagline}
                  </p>

                  {/* Key tailored features */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                    {sport.solutions.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-neutral-500 dark:text-neutral-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-6 mt-2">
                  <button
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCurrent
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 group-hover:bg-primary-500 group-hover:text-white'
                    }`}
                  >
                    <span>{isCurrent ? 'Текущий спорт' : 'Выбрать этот спорт'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back / Close button if sport already picked */}
        {selectedSport && onCancel && (
          <div className="text-center pt-2">
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-200 underline transition-colors"
            >
              Оставить текущий вид спорта и вернуться
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
