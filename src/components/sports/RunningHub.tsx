import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Gauge, MapPin, Sparkles, Volume2 } from 'lucide-react';
import { playCadenceClick, playTimerBeep, playWhistle } from '../../lib/sounds';

interface RunningHubProps {
  isDark: boolean;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  onFinishWorkout: (reps: number) => void;
  canGetCoinsToday: boolean;
}

const DISTANCE_PRESETS = [
  { label: '5 км', km: 5 },
  { label: '10 км', km: 10 },
  { label: '21.1 км (Полумарафон)', km: 21.0975 },
  { label: '42.2 км (Марафон)', km: 42.195 },
];

export function RunningHub({
  isDark,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  onFinishWorkout,
  canGetCoinsToday
}: RunningHubProps) {
  const [activeTab, setActiveTab] = useState<'cadence' | 'pace' | 'interval'>('cadence');

  // 1. Cadence Metronome State
  const [cadenceBpm, setCadenceBpm] = useState<number>(175);
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [pulseBeat, setPulseBeat] = useState<boolean>(false);
  const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 2. Pace Calculator State
  const [calcDistanceKm, setCalcDistanceKm] = useState<number>(5);
  const [targetHours, setTargetHours] = useState<number>(0);
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [targetSeconds, setTargetSeconds] = useState<number>(0);

  // 3. Interval Running Timer State
  const [sprintSec, setSprintSec] = useState<number>(30);
  const [jogSec, setJogSec] = useState<number>(60);
  const [totalIntervals, setTotalIntervals] = useState<number>(8);
  const [currentInterval, setCurrentInterval] = useState<number>(1);
  const [intervalPhase, setIntervalPhase] = useState<'idle' | 'sprint' | 'jog'>('idle');
  const [intervalTimeLeft, setIntervalTimeLeft] = useState<number>(sprintSec);
  const [isIntervalActive, setIsIntervalActive] = useState<boolean>(false);

  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Metronome Sound & Pulse
  useEffect(() => {
    if (!isMetronomeActive) {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      setPulseBeat(false);
      return;
    }

    const intervalMs = (60 / cadenceBpm) * 1000;
    metronomeIntervalRef.current = setInterval(() => {
      playCadenceClick();
      setPulseBeat(true);
      setTimeout(() => setPulseBeat(false), 80);
    }, intervalMs);

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomeActive, cadenceBpm]);

  // Interval Running Timer
  useEffect(() => {
    if (!isIntervalActive) {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
      return;
    }

    intervalTimerRef.current = setInterval(() => {
      setIntervalTimeLeft(prev => {
        if (prev <= 1) {
          if (intervalPhase === 'sprint') {
            playTimerBeep();
            setIntervalPhase('jog');
            return jogSec;
          } else if (intervalPhase === 'jog') {
            if (currentInterval >= totalIntervals) {
              playWhistle();
              setIsIntervalActive(false);
              setIntervalPhase('idle');
              return 0;
            } else {
              playWhistle();
              setCurrentInterval(c => c + 1);
              setIntervalPhase('sprint');
              return sprintSec;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [isIntervalActive, intervalPhase, currentInterval, totalIntervals, sprintSec, jogSec]);

  // Pace Math
  const totalTargetSeconds = targetHours * 3600 + targetMinutes * 60 + targetSeconds;
  const paceSecondsPerKm = calcDistanceKm > 0 ? totalTargetSeconds / calcDistanceKm : 0;
  const paceMinutes = Math.floor(paceSecondsPerKm / 60);
  const paceSeconds = Math.round(paceSecondsPerKm % 60);
  const speedKmh = paceSecondsPerKm > 0 ? (3600 / paceSecondsPerKm).toFixed(1) : '0';

  const startIntervals = () => {
    playWhistle();
    setIntervalPhase('sprint');
    setCurrentInterval(1);
    setIntervalTimeLeft(sprintSec);
    setIsIntervalActive(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs: Cadence, Pace, Intervals */}
      <div className={`p-3 ${getContainerStyles()} flex items-center justify-center gap-2`}>
        <button
          onClick={() => setActiveTab('cadence')}
          className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${getButtonStyles()} ${
            activeTab === 'cadence'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
          }`}
        >
          <Activity className="w-4 h-4" />
          Каденс-метроном
        </button>

        <button
          onClick={() => setActiveTab('pace')}
          className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${getButtonStyles()} ${
            activeTab === 'pace'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Калькулятор темпа
        </button>

        <button
          onClick={() => setActiveTab('interval')}
          className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold flex items-center justify-center gap-2 border transition-all ${getButtonStyles()} ${
            activeTab === 'interval'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Интервалы / Фартлек
        </button>
      </div>

      {/* 1. Cadence Metronome Tab */}
      {activeTab === 'cadence' && (
        <div className={`p-6 md:p-8 ${getContainerStyles()} text-center border-2 border-emerald-500/30`}>
          <div className="max-w-md mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
              КАДЕНС БЕГА (ШАГОВ В МИНУТУ / SPM)
            </span>

            {/* Visual Pulsing Heartbeat / Beat Circle */}
            <div className="py-4">
              <div
                className={`w-32 h-32 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-75 border-4 ${
                  pulseBeat
                    ? 'scale-110 bg-emerald-500 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.7)]'
                    : isMetronomeActive
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 scale-100'
                    : isDark
                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                }`}
              >
                <div className="text-4xl font-black">{cadenceBpm}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider">шагов/мин</div>
              </div>
            </div>

            {/* Slider & Quick Presets */}
            <div className="space-y-2">
              <input
                type="range"
                min="150"
                max="200"
                value={cadenceBpm}
                onChange={e => setCadenceBpm(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>150 (медленно)</span>
                <span className="text-emerald-500 font-bold">175-180 (золотой стандарт)</span>
                <span>200 (спринт)</span>
              </div>
            </div>

            {/* Recommended buttons */}
            <div className="flex justify-center gap-2 pt-2">
              {[165, 170, 175, 180, 185].map(bpm => (
                <button
                  key={bpm}
                  onClick={() => setCadenceBpm(bpm)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    cadenceBpm === bpm ? 'bg-emerald-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                >
                  {bpm}
                </button>
              ))}
            </div>

            {/* Toggle button */}
            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className={`w-full py-4 rounded-2xl text-white font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 ${
                isMetronomeActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isMetronomeActive ? (
                <>
                  <Pause className="w-6 h-6 fill-current" /> ОСТАНОВИТЬ МЕТРОНОМ
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" /> ЗАПУСТИТЬ МЕТРОНОМ (РИТМ)
                </>
              )}
            </button>

            <div className={`text-xs ${mutedTextClass} pt-2`}>
              💡 Тренеры рекомендуют держать каденс 175–180: это снижает ударную нагрузку на коленные суставы и экономит до 15% энергии на дистанции.
            </div>
          </div>
        </div>
      )}

      {/* 2. Pace Calculator Tab */}
      {activeTab === 'pace' && (
        <div className={`p-6 ${getContainerStyles()} border-2 border-emerald-500/30 space-y-6`}>
          <div>
            <h3 className="font-bold text-lg text-emerald-500 flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Калькулятор темпа бега (Pace Calculator)
            </h3>
            <p className={`text-xs ${mutedTextClass}`}>
              Рассчитайте необходимый темп (мин/км) и скорость (км/ч) для желаемой дистанции и времени
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">
                  Дистанция (км):
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={calcDistanceKm}
                    onChange={e => setCalcDistanceKm(Math.max(0.1, Number(e.target.value) || 0))}
                    step="0.5"
                    className={`w-full p-2.5 rounded-xl border font-bold text-lg ${
                      isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                  <span className="font-bold text-sm">км</span>
                </div>

                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {DISTANCE_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setCalcDistanceKm(p.km)}
                      className="text-xs px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 font-semibold"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">
                  Желаемое финишное время:
                </label>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <input
                      type="number"
                      value={targetHours}
                      onChange={e => setTargetHours(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-full p-2 rounded-lg border font-bold text-center ${
                        isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                    <span className="text-[10px] text-neutral-400">Часов</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={targetMinutes}
                      onChange={e => setTargetMinutes(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-full p-2 rounded-lg border font-bold text-center ${
                        isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                    <span className="text-[10px] text-neutral-400">Минут</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={targetSeconds}
                      onChange={e => setTargetSeconds(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-full p-2 rounded-lg border font-bold text-center ${
                        isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                    <span className="text-[10px] text-neutral-400">Секунд</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results card */}
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div>
                <span className="text-xs uppercase font-bold text-emerald-400">Необходимый темп</span>
                <div className="text-5xl font-black text-emerald-500 tracking-tight mt-1">
                  {paceMinutes}:{paceSeconds < 10 ? '0' : ''}{paceSeconds}{' '}
                  <span className="text-lg font-bold">мин/км</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex justify-around">
                <div>
                  <div className="text-xs text-neutral-400">Скорость</div>
                  <div className="text-xl font-bold text-neutral-200 dark:text-white">{speedKmh} км/ч</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Дистанция</div>
                  <div className="text-xl font-bold text-neutral-200 dark:text-white">{calcDistanceKm} км</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interval Running Timer Tab */}
      {activeTab === 'interval' && (
        <div className={`p-6 ${getContainerStyles()} border-2 border-emerald-500/30 text-center space-y-4`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              ИНТЕРВАЛЬНЫЙ БЕГ (HIIT / СПРИНТ + ТРУСЦА)
            </span>
            <span className="text-sm font-bold">
              Интервал {currentInterval} из {totalIntervals}
            </span>
          </div>

          <div
            className={`p-8 rounded-3xl border-4 text-center transition-all ${
              intervalPhase === 'sprint'
                ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                : intervalPhase === 'jog'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                : isDark
                ? 'bg-neutral-800 border-neutral-700 text-neutral-300'
                : 'bg-neutral-100 border-neutral-300 text-neutral-700'
            }`}
          >
            <div className="text-sm font-black uppercase tracking-widest mb-1">
              {intervalPhase === 'sprint'
                ? '🔥 УСКОРЕНИЕ / СПРИНТ!'
                : intervalPhase === 'jog'
                ? '🍃 ТРУСЦА / ВОССТАНОВЛЕНИЕ'
                : 'ГОТОВ К СТАРТУ'}
            </div>
            <div className="text-7xl font-black font-mono my-2">{intervalTimeLeft} сек</div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isIntervalActive ? (
              <button
                onClick={startIntervals}
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg flex items-center gap-2 shadow-lg"
              >
                <Play className="w-5 h-5 fill-current" /> СТАРТ ИНТЕРВАЛОВ
              </button>
            ) : (
              <button
                onClick={() => setIsIntervalActive(false)}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg flex items-center gap-2 shadow-lg"
              >
                <Pause className="w-5 h-5 fill-current" /> ПАУЗА
              </button>
            )}

            <button
              onClick={() => {
                setIsIntervalActive(false);
                setIntervalPhase('idle');
                setCurrentInterval(1);
                setIntervalTimeLeft(sprintSec);
              }}
              className="p-3.5 rounded-2xl bg-neutral-700 text-white font-bold"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Finish Run */}
      <div className={`p-4 ${getContainerStyles()} flex flex-col sm:flex-row items-center justify-between gap-4`}>
        <div className="text-xs text-neutral-400">
          Беговая тренировка записана в журнал
        </div>

        <button
          onClick={() => onFinishWorkout(50)}
          className={`w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg ${getButtonStyles()}`}
        >
          Завершить бег {canGetCoinsToday && '(+5 🪙)'}
        </button>
      </div>
    </div>
  );
}
