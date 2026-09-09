import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Plus, Minus, Bell, Sparkles } from 'lucide-react';
import { playBoxingBell, playTimerBeep, playWhistle } from '../../lib/sounds';

interface WodHubProps {
  isDark: boolean;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  onFinishWorkout: (reps: number) => void;
  canGetCoinsToday: boolean;
}

type WodMode = 'emom' | 'amrap' | 'fortime' | 'tabata';

export function WodHub({
  isDark,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  onFinishWorkout,
  canGetCoinsToday
}: WodHubProps) {
  const [mode, setMode] = useState<WodMode>('amrap');

  // Parameters
  const [minutesDuration, setMinutesDuration] = useState<number>(12);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(12 * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  // AMRAP Round counter
  const [roundsCompleted, setRoundsCompleted] = useState<number>(0);

  // Tabata specifics
  const [tabataRound, setTabataRound] = useState<number>(1);
  const [tabataPhase, setTabataPhase] = useState<'work' | 'rest'>('work');
  const [tabataTimeLeft, setTabataTimeLeft] = useState<number>(20);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch mode
  const handleModeChange = (newMode: WodMode) => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'amrap') {
      setMinutesDuration(12);
      setSecondsRemaining(12 * 60);
    } else if (newMode === 'emom') {
      setMinutesDuration(10);
      setSecondsRemaining(10 * 60);
    } else if (newMode === 'fortime') {
      setStopwatchSeconds(0);
    } else if (newMode === 'tabata') {
      setTabataRound(1);
      setTabataPhase('work');
      setTabataTimeLeft(20);
    }
  };

  // Main WOD loop
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      if (mode === 'amrap') {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            playBoxingBell();
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      } else if (mode === 'emom') {
        setSecondsRemaining(prev => {
          // At the start of every new minute (60s mark), play a bell gong!
          if (prev > 1 && (prev - 1) % 60 === 0) {
            playBoxingBell();
          }
          if (prev <= 1) {
            playBoxingBell();
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      } else if (mode === 'fortime') {
        setStopwatchSeconds(s => s + 1);
      } else if (mode === 'tabata') {
        setTabataTimeLeft(prev => {
          if (prev <= 1) {
            if (tabataPhase === 'work') {
              playTimerBeep();
              setTabataPhase('rest');
              return 10;
            } else {
              if (tabataRound >= 8) {
                playBoxingBell();
                setIsActive(false);
                return 0;
              } else {
                playBoxingBell();
                setTabataRound(r => r + 1);
                setTabataPhase('work');
                return 20;
              }
            }
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, tabataPhase, tabataRound]);

  const handleStart = () => {
    playBoxingBell();
    setIsActive(true);
  };

  const handleReset = () => {
    setIsActive(false);
    if (mode === 'fortime') {
      setStopwatchSeconds(0);
    } else if (mode === 'tabata') {
      setTabataRound(1);
      setTabataPhase('work');
      setTabataTimeLeft(20);
    } else {
      setSecondsRemaining(minutesDuration * 60);
    }
    setRoundsCompleted(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Mode selection tabs */}
      <div className={`p-3 ${getContainerStyles()} grid grid-cols-2 sm:grid-cols-4 gap-2`}>
        {(['amrap', 'emom', 'fortime', 'tabata'] as WodMode[]).map(m => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`py-2 px-3 text-xs md:text-sm font-bold uppercase tracking-wider border transition-all ${getButtonStyles()} ${
              mode === m
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
            }`}
          >
            {m === 'amrap'
              ? 'AMRAP'
              : m === 'emom'
              ? 'EMOM'
              : m === 'fortime'
              ? 'FOR TIME'
              : 'TABATA'}
          </button>
        ))}
      </div>

      {/* Main WOD Display */}
      <div className={`p-6 md:p-10 rounded-3xl border-4 text-center ${
        isActive ? 'bg-amber-500/15 border-amber-500' : isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'
      }`}>
        <div className="text-xs font-black uppercase tracking-widest text-amber-500 mb-1">
          {mode === 'amrap' && `AMRAP (Максимум раундов за ${minutesDuration} мин)`}
          {mode === 'emom' && `EMOM (Каждую минуту старт раунда)`}
          {mode === 'fortime' && 'FOR TIME (Секундомер на время)'}
          {mode === 'tabata' && `TABATA (Раунд ${tabataRound} из 8: ${tabataPhase === 'work' ? 'РАБОТА 20с' : 'ОТДЫХ 10с'})`}
        </div>

        <div className="text-7xl md:text-9xl font-black font-mono tracking-tight my-4">
          {mode === 'fortime'
            ? formatTime(stopwatchSeconds)
            : mode === 'tabata'
            ? `${tabataTimeLeft}s`
            : formatTime(secondsRemaining)}
        </div>

        {/* AMRAP Round Counter */}
        {mode === 'amrap' && (
          <div className="my-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 max-w-sm mx-auto flex items-center justify-between">
            <span className="font-bold text-sm">Завершено раундов:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRoundsCompleted(r => Math.max(0, r - 1))}
                className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 font-black text-xl flex items-center justify-center"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-3xl font-black text-amber-500">{roundsCompleted}</span>
              <button
                onClick={() => setRoundsCompleted(r => r + 1)}
                className="w-10 h-10 rounded-xl bg-amber-500 text-white font-black text-xl flex items-center justify-center shadow"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Play/Pause/Reset Controls */}
        <div className="flex items-center justify-center gap-4 max-w-md mx-auto mt-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex-1 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xl shadow-xl flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> СТАРТ
            </button>
          ) : (
            <button
              onClick={() => setIsActive(false)}
              className="flex-1 py-4 rounded-2xl bg-neutral-700 text-white font-black text-xl shadow-xl flex items-center justify-center gap-3"
            >
              <Pause className="w-6 h-6 fill-current" /> ПАУЗА
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-4 rounded-2xl bg-neutral-700 text-white font-bold"
            title="Сброс"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Finish WOD CTA */}
      <div className={`p-4 ${getContainerStyles()} flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="text-xs text-neutral-400">
          WOD тренировка завершена
        </div>

        <button
          onClick={() => onFinishWorkout(40)}
          className={`w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg ${getButtonStyles()}`}
        >
          Завершить WOD {canGetCoinsToday && '(+5 🪙)'}
        </button>
      </div>
    </div>
  );
}
