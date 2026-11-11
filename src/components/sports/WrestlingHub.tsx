import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Award, Shield, User, Volume2, Sparkles } from 'lucide-react';
import { playWhistle, playTimerBeep } from '../../lib/sounds';

interface WrestlingHubProps {
  isDark: boolean;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  onFinishWorkout: (reps: number) => void;
}

interface FighterScore {
  name: string;
  points: number;
  advantages: number;
  penalties: number;
}

const DURATION_PRESETS = [
  { id: 'white_belt', name: '🥋 5 мин (Белый пояс)', seconds: 300 },
  { id: 'blue_belt', name: '🥋 6 мин (Синий пояс)', seconds: 360 },
  { id: 'purple_belt', name: '🥋 7 мин (Пурпурный)', seconds: 420 },
  { id: 'black_belt', name: '🥋 10 мин (Черный пояс / ADCC)', seconds: 600 },
  { id: 'open_mat', name: '🔄 Open Mat (5 мин + 1 мин смена)', seconds: 300, isRoundRobin: true },
];

export function WrestlingHub({
  isDark,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  onFinishWorkout
}: WrestlingHubProps) {
  const [selectedDurationId, setSelectedDurationId] = useState('blue_belt');
  const activePreset = DURATION_PRESETS.find(p => p.id === selectedDurationId) || DURATION_PRESETS[1];

  const [matchSeconds, setMatchSeconds] = useState(activePreset.seconds);
  const [secondsRemaining, setSecondsRemaining] = useState(activePreset.seconds);
  const [isActive, setIsActive] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  // Fighter 1 (Blue)
  const [fighter1, setFighter1] = useState<FighterScore>({
    name: 'Борец 1 (Синий)',
    points: 0,
    advantages: 0,
    penalties: 0
  });

  // Fighter 2 (White / Red)
  const [fighter2, setFighter2] = useState<FighterScore>({
    name: 'Борец 2 (Красный)',
    points: 0,
    advantages: 0,
    penalties: 0
  });

  const [winnerMessage, setWinnerMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          playWhistle();
          if (activePreset.isRoundRobin) {
            if (!isBreakTime) {
              // Switch to 60 sec rest
              setIsBreakTime(true);
              return 60;
            } else {
              // Next round
              setIsBreakTime(false);
              setRoundNumber(r => r + 1);
              // Reset points for new pair
              resetScores();
              return activePreset.seconds;
            }
          } else {
            setIsActive(false);
            determineWinner();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isBreakTime, activePreset]);

  const determineWinner = () => {
    if (fighter1.points > fighter2.points) {
      setWinnerMessage(`🏆 Победа по очкам: ${fighter1.name} (${fighter1.points} : ${fighter2.points})`);
    } else if (fighter2.points > fighter1.points) {
      setWinnerMessage(`🏆 Победа по очкам: ${fighter2.name} (${fighter2.points} : ${fighter1.points})`);
    } else if (fighter1.advantages > fighter2.advantages) {
      setWinnerMessage(`🏆 Победа по преимуществам: ${fighter1.name}`);
    } else if (fighter2.advantages > fighter1.advantages) {
      setWinnerMessage(`🏆 Победа по преимуществам: ${fighter2.name}`);
    } else {
      setWinnerMessage(`🤝 Ничья (Решение судей)`);
    }
  };

  const handleSubmission = (winner: 1 | 2) => {
    playWhistle();
    setIsActive(false);
    const winName = winner === 1 ? fighter1.name : fighter2.name;
    setWinnerMessage(`🥋 Досрочная победа САБМИШЕНОМ (сдача): ${winName}!`);
  };

  const resetScores = () => {
    setFighter1(prev => ({ ...prev, points: 0, advantages: 0, penalties: 0 }));
    setFighter2(prev => ({ ...prev, points: 0, advantages: 0, penalties: 0 }));
    setWinnerMessage(null);
  };

  const handleStart = () => {
    playWhistle();
    setIsActive(true);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsBreakTime(false);
    setSecondsRemaining(activePreset.seconds);
    resetScores();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const addScore = (fighter: 1 | 2, type: 'pts' | 'adv' | 'pen', delta: number) => {
    playTimerBeep();
    const updater = fighter === 1 ? setFighter1 : setFighter2;
    updater(prev => {
      if (type === 'pts') return { ...prev, points: Math.max(0, prev.points + delta) };
      if (type === 'adv') return { ...prev, advantages: Math.max(0, prev.advantages + delta) };
      return { ...prev, penalties: Math.max(0, prev.penalties + delta) };
    });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. TOP ERGONOMIC: Match Timer & Stage Box */}
      <div className={`p-5 sm:p-6 rounded-3xl text-center border-4 shadow-xl ${
        isBreakTime 
          ? 'bg-amber-500/15 border-amber-500' 
          : isActive 
          ? 'bg-purple-500/15 border-purple-500' 
          : isDark 
          ? 'bg-neutral-850 border-neutral-750' 
          : 'bg-white border-neutral-200'
      }`}>
        <div className="text-xs font-black uppercase tracking-widest text-purple-400 mb-1">
          {isBreakTime ? '🔄 СМЕНА ПАРТНЕРОВ (ОТДЫХ 1 МИН)' : `СХВАТКА #${roundNumber} (IBJJF / БОРЬБА)`}
        </div>

        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight my-2 select-none">
          {formatTime(secondsRemaining)}
        </div>

        {winnerMessage && (
          <div className="p-3 my-2 rounded-xl bg-purple-600 text-white font-black text-sm sm:text-base animate-bounce">
            {winnerMessage}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex-1 max-w-xs py-3.5 sm:py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <Play className="w-5 h-5 fill-current" /> СТАРТ СХВАТКИ
            </button>
          ) : (
            <button
              onClick={() => setIsActive(false)}
              className="flex-1 max-w-xs py-3.5 sm:py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <Pause className="w-5 h-5 fill-current" /> ПАУЗА
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-3.5 sm:p-4 rounded-2xl bg-neutral-700 hover:bg-neutral-600 text-white font-bold active:scale-95 transition-transform"
            title="Сброс таймера и очков"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Format / Duration Presets */}
      <div className={`p-3 rounded-2xl ${getContainerStyles()} flex flex-wrap items-center justify-between gap-2.5`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
          <span className="text-xs font-semibold text-purple-500 uppercase tracking-wider shrink-0 mr-1">Регламент:</span>
          {DURATION_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedDurationId(p.id);
                setMatchSeconds(p.seconds);
                setSecondsRemaining(p.seconds);
                setIsActive(false);
                setIsBreakTime(false);
              }}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${getButtonStyles()} ${
                selectedDurationId === p.id
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
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
          onClick={() => playWhistle()}
          className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 border border-purple-500/40 text-purple-500 hover:bg-purple-500/10 ${getButtonStyles()}`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Свисток
        </button>
      </div>

      {/* IBJJF Dual Fighter Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fighter 1 (Blue) */}
        <div className="p-5 rounded-3xl border-4 border-blue-500 bg-blue-500/10 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={fighter1.name}
              onChange={e => setFighter1({ ...fighter1, name: e.target.value })}
              className="bg-transparent font-black text-lg text-blue-500 border-b border-blue-400/40 focus:outline-none w-2/3"
            />
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-500 text-white">
              СИНИЙ
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-neutral-400">БАЛЛЫ (Points)</div>
              <div className="text-6xl font-black text-blue-500">{fighter1.points}</div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs font-bold text-amber-500">
                Преимущества: <span className="text-lg">{fighter1.advantages}</span>
              </div>
              <div className="text-xs font-bold text-red-500">
                Штрафы: <span className="text-lg">{fighter1.penalties}</span>
              </div>
            </div>
          </div>

          {/* Quick IBJJF Scoring Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addScore(1, 'pts', 2)}
              className="py-2 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
            >
              +2 Тейкдаун/Свип
            </button>
            <button
              onClick={() => addScore(1, 'pts', 3)}
              className="py-2 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
            >
              +3 Пасс гарда
            </button>
            <button
              onClick={() => addScore(1, 'pts', 4)}
              className="py-2 px-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow"
            >
              +4 Маунт / Бэк
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => addScore(1, 'adv', 1)}
              className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 font-bold text-xs border border-amber-500/40"
            >
              +1 Преимущество
            </button>
            <button
              onClick={() => addScore(1, 'pen', 1)}
              className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-500 font-bold text-xs border border-red-500/40"
            >
              +1 Штраф
            </button>
            <button
              onClick={() => addScore(1, 'pts', -1)}
              className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-xs font-bold"
            >
              -1
            </button>
          </div>

          <button
            onClick={() => handleSubmission(1)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm tracking-wide shadow"
          >
            🥋 ПОБЕДА САБМИШЕНОМ (Сдача соперника)
          </button>
        </div>

        {/* Fighter 2 (Red) */}
        <div className="p-5 rounded-3xl border-4 border-red-500 bg-red-500/10 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <input
              type="text"
              value={fighter2.name}
              onChange={e => setFighter2({ ...fighter2, name: e.target.value })}
              className="bg-transparent font-black text-lg text-red-500 border-b border-red-400/40 focus:outline-none w-2/3"
            />
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-red-500 text-white">
              КРАСНЫЙ
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-neutral-400">БАЛЛЫ (Points)</div>
              <div className="text-6xl font-black text-red-500">{fighter2.points}</div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs font-bold text-amber-500">
                Преимущества: <span className="text-lg">{fighter2.advantages}</span>
              </div>
              <div className="text-xs font-bold text-red-500">
                Штрафы: <span className="text-lg">{fighter2.penalties}</span>
              </div>
            </div>
          </div>

          {/* Quick IBJJF Scoring Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addScore(2, 'pts', 2)}
              className="py-2 px-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
            >
              +2 Тейкдаун/Свип
            </button>
            <button
              onClick={() => addScore(2, 'pts', 3)}
              className="py-2 px-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
            >
              +3 Пасс гарда
            </button>
            <button
              onClick={() => addScore(2, 'pts', 4)}
              className="py-2 px-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow"
            >
              +4 Маунт / Бэк
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => addScore(2, 'adv', 1)}
              className="flex-1 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 font-bold text-xs border border-amber-500/40"
            >
              +1 Преимущество
            </button>
            <button
              onClick={() => addScore(2, 'pen', 1)}
              className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-500 font-bold text-xs border border-red-500/40"
            >
              +1 Штраф
            </button>
            <button
              onClick={() => addScore(2, 'pts', -1)}
              className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-xs font-bold"
            >
              -1
            </button>
          </div>

          <button
            onClick={() => handleSubmission(2)}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm tracking-wide shadow"
          >
            🥋 ПОБЕДА САБМИШЕНОМ (Сдача соперника)
          </button>
        </div>
      </div>

      {/* Finish Wrestling Session */}
      <div className={`p-4 ${getContainerStyles()} flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="text-xs text-neutral-400">
          Схваток проведено: <span className="font-bold text-purple-400">{roundNumber}</span>
        </div>

        <button
          onClick={() => onFinishWorkout(roundNumber * 25)}
          className={`w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg ${getButtonStyles()}`}
        >
          Завершить борьбу
        </button>
      </div>
    </div>
  );
}
