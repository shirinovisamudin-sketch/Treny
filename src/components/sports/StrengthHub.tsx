import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Dumbbell,
  Calculator,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Settings,
  Plus,
  Edit3,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { playTimerBeep, playCoinSound } from '../../lib/sounds';
import {
  DEFAULT_PROGRAMS,
  WorkoutProgram,
  CustomExerciseItem,
  EXERCISE_LIBRARY
} from '../../data/exerciseLibrary';
import { ExerciseGraphic } from './strength/ExerciseGraphic';
import { CustomWorkoutBuilderModal } from './strength/CustomWorkoutBuilderModal';

interface StrengthHubProps {
  isDark: boolean;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  onFinishWorkout: (reps: number) => void;
  canGetCoinsToday: boolean;
}

export function StrengthHub({
  isDark,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  onFinishWorkout,
  canGetCoinsToday
}: StrengthHubProps) {
  // Programs from localStorage or default
  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => {
    try {
      const saved = localStorage.getItem('treny_strength_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROGRAMS;
  });

  const [activeProgramId, setActiveProgramId] = useState<string>(() => {
    const saved = localStorage.getItem('treny_active_program_id');
    return saved || 'chest_tri';
  });

  // Current active program
  const currentProgram = programs.find(p => p.id === activeProgramId) || programs[0] || DEFAULT_PROGRAMS[0];

  // Active exercise index inside program (0 to length - 1)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);

  // Safety check on activeExerciseIndex
  const safeExerciseIndex = Math.min(
    Math.max(0, activeExerciseIndex),
    Math.max(0, currentProgram.exercises.length - 1)
  );

  const currentExercise = currentProgram.exercises[safeExerciseIndex] || currentProgram.exercises[0];

  // Completed sets tracker: { [exerciseIndex]: [boolean, boolean, ...] }
  const [completedSetsMap, setCompletedSetsMap] = useState<Record<number, boolean[]>>({});

  // Dynamic set weights & reps (if user tweaks them during workout)
  const [exerciseOverrides, setExerciseOverrides] = useState<
    Record<number, { weight: number; reps: number }>
  >({});

  // Rest Timer
  const [restDuration, setRestDuration] = useState<number>(90);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Modals & Bottom Drawers
  const [builderModalOpen, setBuilderModalOpen] = useState<boolean>(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | undefined>(undefined);
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'plate' | '1rm'>('plate');

  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState<number>(80);
  const [barWeight, setBarWeight] = useState<number>(20);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState<number>(70);
  const [calcReps, setCalcReps] = useState<number>(8);

  // Sync programs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('treny_strength_programs', JSON.stringify(programs));
      localStorage.setItem('treny_active_program_id', activeProgramId);
    } catch (e) {
      console.error(e);
    }
  }, [programs, activeProgramId]);

  // Reset or initialize sets when program changes
  useEffect(() => {
    const initialSets: Record<number, boolean[]> = {};
    currentProgram.exercises.forEach((ex, idx) => {
      initialSets[idx] = new Array(ex.setsCount).fill(false);
    });
    setCompletedSetsMap(initialSets);
    setActiveExerciseIndex(0);
  }, [activeProgramId]);

  // Timer countdown hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            playTimerBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const startRestTimer = (seconds?: number) => {
    const dur = seconds !== undefined ? seconds : restDuration;
    setTimeLeft(dur);
    setTimerActive(true);
  };

  const stopRestTimer = () => {
    setTimerActive(false);
  };

  const resetRestTimer = () => {
    setTimerActive(false);
    setTimeLeft(restDuration);
  };

  // Toggle single set completion
  const handleToggleSet = (setIdx: number) => {
    const currentSets = completedSetsMap[safeExerciseIndex] || new Array(currentExercise.setsCount).fill(false);
    const willBeDone = !currentSets[setIdx];

    const nextSets = [...currentSets];
    nextSets[setIdx] = willBeDone;

    setCompletedSetsMap(prev => ({
      ...prev,
      [safeExerciseIndex]: nextSets
    }));

    // If just completed set, play feedback sound & trigger rest timer!
    if (willBeDone) {
      try {
        playCoinSound();
      } catch (e) {}
      startRestTimer(restDuration);
    }
  };

  // Save new or updated workout program
  const handleSaveProgram = (newProgram: WorkoutProgram) => {
    setPrograms(prev => {
      const existingIdx = prev.findIndex(p => p.id === newProgram.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newProgram;
        return updated;
      }
      return [...prev, newProgram];
    });

    setActiveProgramId(newProgram.id);
    setActiveExerciseIndex(0);
  };

  // Total completed reps calculation
  const totalCompletedReps = Object.entries(completedSetsMap).reduce((sum, [idxStr, setsArr]) => {
    const exIdx = Number(idxStr);
    const ex = currentProgram.exercises[exIdx];
    if (!ex) return sum;
    const reps = exerciseOverrides[exIdx]?.reps || ex.repsCount;
    const doneCount = (setsArr as boolean[]).filter(Boolean).length;
    return sum + doneCount * reps;
  }, 0);

  // Total sets done vs total sets
  const totalSetsGoal = currentProgram.exercises.reduce((sum, ex) => sum + ex.setsCount, 0);
  const totalSetsCompleted = (Object.values(completedSetsMap) as boolean[][]).reduce(
    (sum, setsArr) => sum + (setsArr || []).filter(Boolean).length,
    0
  );

  // Current exercise specific metadata
  const currentDef = EXERCISE_LIBRARY.find(e => e.id === currentExercise.exerciseId);
  const currentSets = completedSetsMap[safeExerciseIndex] || new Array(currentExercise.setsCount).fill(false);
  const activeWeight = exerciseOverrides[safeExerciseIndex]?.weight ?? currentExercise.weight;
  const activeReps = exerciseOverrides[safeExerciseIndex]?.reps ?? currentExercise.repsCount;

  // Plate calculation logic
  const calculatePlates = () => {
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    const weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);
    let remaining = weightPerSide;
    const result: { weight: number; count: number }[] = [];

    for (const p of availablePlates) {
      const count = Math.floor(remaining / p);
      if (count > 0) {
        result.push({ weight: p, count });
        remaining = Number((remaining - count * p).toFixed(2));
      }
    }
    return { weightPerSide, plates: result, remainder: remaining };
  };

  // 1RM logic (Epley)
  const estimated1RM = Math.round(calcWeight * (1 + calcReps / 30));
  const percentages = [
    { pct: 95, label: '95% (1-2 повт)', wt: Math.round(estimated1RM * 0.95) },
    { pct: 90, label: '90% (3-4 повт)', wt: Math.round(estimated1RM * 0.9) },
    { pct: 85, label: '85% (5-6 повт)', wt: Math.round(estimated1RM * 0.85) },
    { pct: 80, label: '80% (7-8 повт)', wt: Math.round(estimated1RM * 0.8) },
    { pct: 75, label: '75% (9-10 повт)', wt: Math.round(estimated1RM * 0.75) },
    { pct: 70, label: '70% (10-12 повт)', wt: Math.round(estimated1RM * 0.7) }
  ];

  const plateCalc = calculatePlates();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. TOP ERGONOMIC BAR: Rest Timer & Quick Metrics (Tappable with Thumb) */}
      <div
        className={`p-3.5 sm:p-4 rounded-3xl ${getContainerStyles()} border transition-all ${
          timerActive ? 'ring-2 ring-primary-500/50 bg-primary-500/5' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Workout progress metrics */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Прогресс тренировки</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-primary-500">
                {totalCompletedReps} <span className="text-xs font-bold text-neutral-400">повт.</span>
              </span>
              <span className="text-xs font-semibold text-neutral-400">
                ({totalSetsCompleted} / {totalSetsGoal} сетов)
              </span>
            </div>
          </div>

          {/* Quick Rest Timer Controller */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-primary-500" />
                Отдых
              </div>
              <div
                className={`text-lg sm:text-xl font-black tabular-nums transition-colors ${
                  timerActive ? 'text-primary-500 animate-pulse' : 'text-neutral-300'
                }`}
              >
                {timerActive ? `${timeLeft} с` : `${restDuration} с`}
              </div>
            </div>

            {/* Timer quick start / pause button */}
            {timerActive ? (
              <button
                onClick={stopRestTimer}
                className="w-10 h-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                title="Остановить таймер"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => startRestTimer()}
                className="w-10 h-10 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                title="Запустить таймер отдыха"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            )}

            <button
              onClick={resetRestTimer}
              className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Сброс"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick rest presets pills */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-neutral-200 dark:border-neutral-800/80 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-neutral-400 shrink-0 mr-1">Пауза:</span>
          {[45, 60, 90, 120, 180].map(sec => (
            <button
              key={sec}
              onClick={() => {
                setRestDuration(sec);
                if (timerActive) startRestTimer(sec);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                restDuration === sec
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {sec}с
            </button>
          ))}
        </div>
      </div>

      {/* 2. PROGRAM SELECTION & EXERCISE SWITCHER RIBBON */}
      <div className={`p-3 rounded-2xl ${getContainerStyles()} space-y-2.5`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-500 truncate">
              {currentProgram.name}
            </span>
            {currentProgram.isCustom && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black shrink-0">
                СВОЯ
              </span>
            )}
          </div>

          {/* Edit / Customize Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setEditingProgram(currentProgram);
                setBuilderModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Настроить упражнения этой программы"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Настроить</span>
            </button>

            <button
              onClick={() => {
                setEditingProgram(undefined);
                setBuilderModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Создать свой план с нуля"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Свой план</span>
            </button>
          </div>
        </div>

        {/* Horizontal Exercise Pills with done indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {currentProgram.exercises.map((ex, idx) => {
            const isCurrent = idx === safeExerciseIndex;
            const sets = completedSetsMap[idx] || [];
            const isAllDone = sets.length > 0 && sets.every(Boolean);

            return (
              <button
                key={`${ex.exerciseId}_${idx}`}
                onClick={() => setActiveExerciseIndex(idx)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-primary-500 text-white border-primary-600 shadow-md scale-[1.02]'
                    : isAllDone
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : isDark
                    ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:text-neutral-900'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
                  {isAllDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </span>
                <span className="truncate max-w-[120px]">{ex.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CURRENT ACTIVE EXERCISE: HERO GRAPHICAL CARD */}
      <div className={`p-4 sm:p-5 rounded-3xl ${getContainerStyles()} border shadow-sm relative overflow-hidden`}>
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        {/* Exercise Header & Navigation Arrows */}
        <div className="flex items-start justify-between gap-3 mb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-wider">
                Упражнение {safeExerciseIndex + 1} из {currentProgram.exercises.length}
              </span>
              {currentDef?.categoryTitle && (
                <span className="text-[10px] text-neutral-400 font-bold">
                  • {currentDef.categoryTitle}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{currentExercise.name}</h2>
          </div>

          {/* Quick Prev / Next Exercise Switch Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
              disabled={safeExerciseIndex === 0}
              className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-400 flex items-center justify-center transition-colors"
              title="Предыдущее упражнение"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setActiveExerciseIndex(prev => Math.min(currentProgram.exercises.length - 1, prev + 1))
              }
              disabled={safeExerciseIndex === currentProgram.exercises.length - 1}
              className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-400 flex items-center justify-center transition-colors"
              title="Следующее упражнение"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Graphic Illustration Card & Muscles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-4 p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          {/* The Visual Graphic */}
          <div className="flex justify-center items-center py-2">
            <ExerciseGraphic
              graphicKey={currentExercise.graphicKey}
              photoUrl={currentExercise.photoUrl || currentDef?.photoUrl}
              exerciseName={currentExercise.name}
              size="hero"
            />
          </div>

          {/* Exercise details & target muscles */}
          <div className="space-y-2 text-xs">
            {currentDef?.targetMuscles && (
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Целевые мышцы:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentDef.targetMuscles.map((m, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold text-[11px]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentDef?.tip && (
              <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-neutral-300">
                <span className="font-bold text-primary-500">Подсказка: </span>
                <span className="text-neutral-400 leading-tight">{currentDef.tip}</span>
              </div>
            )}

            {/* Quick in-place weight and reps adjustments for this session */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Вес снаряда</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() =>
                      setExerciseOverrides(prev => ({
                        ...prev,
                        [safeExerciseIndex]: {
                          weight: Math.max(0, activeWeight - 2.5),
                          reps: activeReps
                        }
                      }))
                    }
                    className="w-6 h-6 rounded-md bg-neutral-300 dark:bg-neutral-700 font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-black text-sm">{activeWeight} кг</span>
                  <button
                    onClick={() =>
                      setExerciseOverrides(prev => ({
                        ...prev,
                        [safeExerciseIndex]: {
                          weight: activeWeight + 2.5,
                          reps: activeReps
                        }
                      }))
                    }
                    className="w-6 h-6 rounded-md bg-neutral-300 dark:bg-neutral-700 font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Цель повторов</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    onClick={() =>
                      setExerciseOverrides(prev => ({
                        ...prev,
                        [safeExerciseIndex]: {
                          weight: activeWeight,
                          reps: Math.max(1, activeReps - 1)
                        }
                      }))
                    }
                    className="w-6 h-6 rounded-md bg-neutral-300 dark:bg-neutral-700 font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-black text-sm">{activeReps}</span>
                  <button
                    onClick={() =>
                      setExerciseOverrides(prev => ({
                        ...prev,
                        [safeExerciseIndex]: {
                          weight: activeWeight,
                          reps: activeReps + 1
                        }
                      }))
                    }
                    className="w-6 h-6 rounded-md bg-neutral-300 dark:bg-neutral-700 font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. TACTILE SET LOGGING BUTTONS (MASSIVE TARGETS FOR MOBILE THUMBS) */}
        <div className="space-y-2 mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Подходы упражнения:</span>
            <span>Тапните для отметки и авто-таймера</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentSets.map((isDone, setIdx) => (
              <button
                key={setIdx}
                onClick={() => handleToggleSet(setIdx)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                  isDone
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : isDark
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                    : 'bg-neutral-100 border-neutral-300 hover:border-neutral-400 text-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      isDone ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {setIdx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm leading-tight">
                      Подход {setIdx + 1}
                    </div>
                    <div className={`text-xs ${isDone ? 'text-white/80' : 'text-neutral-400'}`}>
                      {activeReps} повт. {activeWeight > 0 ? `× ${activeWeight} кг` : '(свой вес)'}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    isDone
                      ? 'bg-white text-emerald-600 shadow scale-105'
                      : 'border-2 border-neutral-400/40 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation & Next Exercise button */}
        <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <button
            onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
            disabled={safeExerciseIndex === 0}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-bold text-xs disabled:opacity-30 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          {safeExerciseIndex < currentProgram.exercises.length - 1 ? (
            <button
              onClick={() => setActiveExerciseIndex(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              Следующее упражнение <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onFinishWorkout(totalCompletedReps)}
              disabled={totalCompletedReps === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Award className="w-4 h-4" /> Завершить тренировку
            </button>
          )}
        </div>
      </div>

      {/* 5. FINISH WORKOUT CARD (ALWAYS CONVENIENTLY AVAILABLE) */}
      <div className={`p-4 rounded-2xl ${getContainerStyles()} flex flex-col sm:flex-row items-center justify-between gap-3`}>
        <div className="text-xs text-neutral-400 text-center sm:text-left">
          {canGetCoinsToday ? (
            <span className="text-amber-500 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-4 h-4" /> Награда за завершение: +5 🪙
            </span>
          ) : (
            <span>Монеты за сегодня уже получены. Завершение обновит ваш рекорд в таблице!</span>
          )}
        </div>

        <button
          onClick={() => onFinishWorkout(totalCompletedReps)}
          disabled={totalCompletedReps === 0}
          className={`w-full sm:w-auto px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${getButtonStyles()}`}
        >
          Завершить тренировку ({totalCompletedReps} повт.)
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 6. SECONDARY ASSISTANT TOOLS (ACCORDION LOWER DOWN, NEVER CLUTTERS WORKOUT) */}
      <div className={`rounded-3xl ${getContainerStyles()} overflow-hidden border`}>
        <button
          onClick={() => setToolsExpanded(!toolsExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Помощники зала & Калькуляторы</div>
              <div className="text-xs text-neutral-400">Блины на штангу и 1RM максимум</div>
            </div>
          </div>
          <div className="p-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-400">
            {toolsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {toolsExpanded && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            {/* Tool tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTool('plate')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                  activeTool === 'plate'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" /> Калькулятор блинов
              </button>

              <button
                onClick={() => setActiveTool('1rm')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                  activeTool === '1rm'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" /> 1RM Максимум
              </button>
            </div>

            {/* Tool 1: Barbell Plate Calculator */}
            {activeTool === 'plate' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-neutral-400">
                  <span>Вес грифа: {barWeight} кг</span>
                  <span>Целевой вес: {targetWeight} кг</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={targetWeight}
                    onChange={e => setTargetWeight(Math.max(barWeight, Number(e.target.value) || 0))}
                    step="2.5"
                    className={`w-full text-center text-lg font-bold p-2 rounded-xl border ${
                      isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                    }`}
                  />
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {[50, 70, 80, 100, 120, 140].map(wt => (
                    <button
                      key={wt}
                      onClick={() => setTargetWeight(wt)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 font-semibold"
                    >
                      {wt} кг
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs font-semibold text-blue-400 mb-1.5">
                    Навесить с каждой стороны: {plateCalc.weightPerSide} кг
                  </div>
                  {plateCalc.plates.length === 0 ? (
                    <div className="text-xs font-bold text-neutral-400">
                      Только пустой гриф ({barWeight} кг)
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {plateCalc.plates.map((p, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                        >
                          <span>{p.weight} кг</span>
                          <span className="text-[10px] bg-black/30 px-1 rounded-full">x{p.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tool 2: 1RM Calculator */}
            {activeTool === '1rm' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                      Рабочий вес (кг)
                    </label>
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={e => setCalcWeight(Number(e.target.value) || 0)}
                      className={`w-full p-2 text-center rounded-xl border font-bold text-sm ${
                        isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                      Повторения (до отказа)
                    </label>
                    <input
                      type="number"
                      value={calcReps}
                      onChange={e => setCalcReps(Number(e.target.value) || 1)}
                      min="1"
                      max="30"
                      className={`w-full p-2 text-center rounded-xl border font-bold text-sm ${
                        isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">Расчетный 1RM:</div>
                  <div className="text-2xl font-black text-amber-500">{estimated1RM} кг</div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {percentages.map(item => (
                    <div
                      key={item.pct}
                      className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-center"
                    >
                      <div className="text-[10px] text-neutral-400">{item.pct}%</div>
                      <div className="text-xs font-bold text-white">{item.wt} кг</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. CUSTOM WORKOUT BUILDER MODAL */}
      <CustomWorkoutBuilderModal
        isOpen={builderModalOpen}
        onClose={() => setBuilderModalOpen(false)}
        onSaveProgram={handleSaveProgram}
        existingProgram={editingProgram}
        isDark={isDark}
      />
    </div>
  );
}
