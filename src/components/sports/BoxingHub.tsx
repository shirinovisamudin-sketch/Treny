import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, ShieldAlert, Sparkles, Flame, Bell } from 'lucide-react';
import { playBoxingBell, playTenSecondClapper, playTimerBeep } from '../../lib/sounds';

interface BoxingHubProps {
  isDark: boolean;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  onFinishWorkout: (reps: number) => void;
  canGetCoinsToday: boolean;
}

type RoundState = 'idle' | 'work' | 'warning' | 'rest';

const PRESETS = [
  { id: 'amateur', name: '🥊 3 x 3 мин (Олимпийский)', rounds: 3, work: 180, rest: 60 },
  { id: 'sparring', name: '🔥 5 x 2 мин (Спарринг)', rounds: 5, work: 120, rest: 45 },
  { id: 'pro', name: '👑 12 x 3 мин (Титульный бой)', rounds: 12, work: 180, rest: 60 },
  { id: 'bag_tabata', name: '⚡ 8 x 20с/10с (Взрыв на мешке)', rounds: 8, work: 20, rest: 10 },
];

const COMBOS = [
  '1 (Джеб)',
  '1 - 2 (Двойка)',
  '1 - 2 - 3 (Двойка + Левый хук)',
  '2 - 3 - 2 (Кросс - Хук - Кросс)',
  '1 - 1 - 2 (Сдвоенный джеб - Кросс)',
  '1 - 4 (Джеб - Правый апперкот)',
  'Уклон влево - 3 (Хук в ответ)',
  'Нырок - 2 - 3 (Контратака)',
  '3 по печени - 3 в голову',
  '1 - 2 - Уклон - 2'
];

export function BoxingHub({
  isDark,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  onFinishWorkout,
  canGetCoinsToday
}: BoxingHubProps) {
  const [selectedPresetId, setSelectedPresetId] = useState('amateur');
  const activePreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  const [totalRounds, setTotalRounds] = useState(activePreset.rounds);
  const [workTime, setWorkTime] = useState(activePreset.work);
  const [restTime, setRestTime] = useState(activePreset.rest);

  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState<RoundState>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(activePreset.work);
  const [isActive, setIsActive] = useState(false);

  // Combo Coach feature
  const [comboCoachActive, setComboCoachActive] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<string>('Нажми Старт для подсказок');
  const [comboTempoSec, setComboTempoSec] = useState<number>(3);

  // Total completed rounds
  const [completedRoundsCount, setCompletedRoundsCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setTotalRounds(preset.rounds);
    setWorkTime(preset.work);
    setRestTime(preset.rest);
    setCurrentRound(1);
    setSecondsRemaining(preset.work);
    setRoundState('idle');
    setIsActive(false);
  };

  // Main round timer loop
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        // 10 second warning during work round!
        if (roundState === 'work' && prev === 11) {
          playTenSecondClapper();
          setRoundState('warning');
        }

        if (prev <= 1) {
          // Time expired for this phase
          if (roundState === 'work' || roundState === 'warning') {
            playBoxingBell();
            setCompletedRoundsCount(c => c + 1);

            if (currentRound >= totalRounds) {
              // Workout finished!
              setIsActive(false);
              setRoundState('idle');
              return 0;
            } else {
              // Transition to rest
              setRoundState('rest');
              return restTime;
            }
          } else if (roundState === 'rest') {
            // Rest finished -> Start next round
            playBoxingBell();
            setCurrentRound(r => r + 1);
            setRoundState('work');
            return workTime;
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, roundState, currentRound, totalRounds, workTime, restTime]);

  // Combo coach loop
  useEffect(() => {
    if (!comboCoachActive || !isActive || (roundState !== 'work' && roundState !== 'warning')) {
      if (comboTimerRef.current) clearInterval(comboTimerRef.current);
      return;
    }

    const nextCombo = () => {
      const random = COMBOS[Math.floor(Math.random() * COMBOS.length)];
      setCurrentCombo(random);
      // Play a prompt beep
      playTimerBeep();
    };

    nextCombo();
    comboTimerRef.current = setInterval(nextCombo, comboTempoSec * 1000);

    return () => {
      if (comboTimerRef.current) clearInterval(comboTimerRef.current);
    };
  }, [comboCoachActive, isActive, roundState, comboTempoSec]);

  const handleStart = () => {
    if (roundState === 'idle') {
      playBoxingBell();
      setRoundState('work');
      setSecondsRemaining(workTime);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setRoundState('idle');
    setCurrentRound(1);
    setSecondsRemaining(workTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Background color based on boxing phase
  const getPhaseStyles = () => {
    if (roundState === 'work') return 'bg-red-500/15 border-red-500 text-red-500';
    if (roundState === 'warning') return 'bg-amber-500/20 border-amber-500 text-amber-500 animate-pulse';
    if (roundState === 'rest') return 'bg-emerald-500/15 border-emerald-500 text-emerald-500';
    return isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-white border-neutral-200 text-neutral-700';
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* 1. TOP ERGONOMIC: Massive Boxing Timer Box (Glove-Friendly!) */}
      <div
        className={`p-5 sm:p-8 rounded-3xl border-4 text-center transition-all ${getPhaseStyles()} shadow-xl relative overflow-hidden`}
      >
        <div className="flex items-center justify-between max-w-md mx-auto mb-2">
          <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/20">
            {roundState === 'idle'
              ? 'ГОТОВНОСТЬ'
              : roundState === 'rest'
              ? '💤 ОТДЫХ'
              : roundState === 'warning'
              ? '⚠️ ПОСЛЕДНИЕ 10 СЕК!'
              : '🔥 РАУНД В ПРОЦЕССЕ'}
          </span>
          <span className="text-base sm:text-lg font-black">
            РАУНД {currentRound} / {totalRounds}
          </span>
        </div>

        {/* Huge Digits for Visibility from Distance */}
        <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tighter my-3 drop-shadow-sm select-none">
          {formatTime(secondsRemaining)}
        </div>

        {/* Big Touch Controls (Can be easily tapped with boxing glove) */}
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto mt-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex-1 py-4 sm:py-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xl sm:text-2xl shadow-xl flex items-center justify-center gap-2.5 transition-transform active:scale-95"
            >
              <Play className="w-7 h-7 fill-current" />
              СТАРТ
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 py-4 sm:py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xl sm:text-2xl shadow-xl flex items-center justify-center gap-2.5 transition-transform active:scale-95"
            >
              <Pause className="w-7 h-7 fill-current" />
              ПАУЗА
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-4 sm:p-5 rounded-2xl bg-neutral-700/80 hover:bg-neutral-600 text-white font-bold transition-transform active:scale-95"
            title="Сброс"
          >
            <RotateCcw className="w-7 h-7" />
          </button>
        </div>

        <div className="mt-3 text-[11px] opacity-75 font-medium">
          Крупные кнопки специально для нажатия в перчатках или на расстоянии
        </div>
      </div>

      {/* 2. Presets Ribbon */}
      <div className={`p-3.5 rounded-2xl ${getContainerStyles()} flex flex-wrap items-center justify-between gap-2.5`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider shrink-0 mr-1">Формат:</span>
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${getButtonStyles()} ${
                selectedPresetId === p.id
                  ? 'bg-red-500 text-white border-red-600 shadow-sm'
                  : isDark
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                  : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => playBoxingBell()}
          className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-red-500/40 text-red-500 hover:bg-red-500/10 ${getButtonStyles()}`}
          title="Тест звука гонга"
        >
          <Bell className="w-3.5 h-3.5" />
          Гонг
        </button>
      </div>

      {/* 3. Combo Callout Coach (Shadow Boxing & Heavy Bag) */}
      <div className={`p-4 rounded-2xl ${getContainerStyles()} border-2 border-red-500/30`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-black text-sm sm:text-base text-red-500 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500" />
              Голосовой комбо-тренер
            </h3>
            <p className={`text-xs ${mutedTextClass}`}>
              Выдает случайные боксерские связки и контратаки в раунде
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-xs text-neutral-400">Темп:</span>
            {[2, 3, 4].map(sec => (
              <button
                key={sec}
                onClick={() => setComboTempoSec(sec)}
                className={`px-2 py-1 text-xs font-bold rounded ${
                  comboTempoSec === sec ? 'bg-red-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                {sec}с
              </button>
            ))}

            <button
              onClick={() => setComboCoachActive(!comboCoachActive)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                comboCoachActive
                  ? 'bg-red-600 text-white border-red-700 shadow'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              {comboCoachActive ? 'ВКЛ' : 'ВКЛЮЧИТЬ'}
            </button>
          </div>
        </div>

        {comboCoachActive && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-center animate-fadeIn">
            <div className="text-[10px] uppercase font-bold text-red-400 mb-0.5">Текущая серия:</div>
            <div className="text-xl sm:text-2xl font-black text-red-500 tracking-tight">
              {currentCombo}
            </div>
          </div>
        )}
      </div>

      {/* 4. Finish Boxing Workout */}
      <div className={`p-4 rounded-2xl ${getContainerStyles()} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-center sm:text-left">
          <span className="text-xs text-neutral-400">Завершено раундов:</span>
          <div className="text-lg font-black text-red-500">{completedRoundsCount} раундов</div>
        </div>

        <button
          onClick={() => onFinishWorkout(completedRoundsCount * 30)}
          disabled={completedRoundsCount === 0}
          className={`w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${getButtonStyles()}`}
        >
          Завершить бокс {canGetCoinsToday && '(+5 🪙)'}
        </button>
      </div>
    </div>
  );
}
