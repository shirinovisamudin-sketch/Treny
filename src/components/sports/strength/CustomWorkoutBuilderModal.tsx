import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Sparkles, Dumbbell, MoveVertical, ShieldCheck, ChevronRight } from 'lucide-react';
import { EXERCISE_LIBRARY, ExerciseDef, WorkoutProgram, CustomExerciseItem } from '../../../data/exerciseLibrary';
import { ExerciseGraphic } from './ExerciseGraphic';

interface CustomWorkoutBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProgram: (newProgram: WorkoutProgram) => void;
  existingProgram?: WorkoutProgram;
  isDark: boolean;
}

export function CustomWorkoutBuilderModal({
  isOpen,
  onClose,
  onSaveProgram,
  existingProgram,
  isDark
}: CustomWorkoutBuilderModalProps) {
  if (!isOpen) return null;

  const [programTitle, setProgramTitle] = useState(existingProgram?.name || 'Моя персональная тренировка');
  const [selectedExercises, setSelectedExercises] = useState<CustomExerciseItem[]>(() => {
    if (existingProgram?.exercises && existingProgram.exercises.length > 0) {
      return [...existingProgram.exercises];
    }
    // Default initial selection
    return [
      { exerciseId: 'bench_press', name: 'Жим штанги лёжа', setsCount: 4, repsCount: 10, weight: 70, graphicKey: 'bench_press' },
      { exerciseId: 'pullups', name: 'Подтягивания широким хватом', setsCount: 4, repsCount: 8, weight: 0, graphicKey: 'pullups' },
      { exerciseId: 'barbell_squat', name: 'Приседания со штангой', setsCount: 4, repsCount: 10, weight: 75, graphicKey: 'squat' }
    ];
  });

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  const categories = [
    { id: 'all', title: 'Все' },
    { id: 'chest', title: '💪 Грудь' },
    { id: 'back', title: '🧗 Спина' },
    { id: 'legs', title: '🦵 Ноги' },
    { id: 'shoulders', title: '🏋️ Плечи' },
    { id: 'arms', title: '🔥 Руки' },
    { id: 'core', title: '⚡ Пресс' }
  ];

  const filteredLibrary = filterCategory === 'all'
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter(e => e.category === filterCategory);

  const addExercise = (def: ExerciseDef) => {
    // Check if already added
    const exists = selectedExercises.find(e => e.exerciseId === def.id);
    if (exists) return;

    setSelectedExercises(prev => [
      ...prev,
      {
        exerciseId: def.id,
        name: def.name,
        setsCount: def.defaultSets,
        repsCount: def.defaultReps,
        weight: def.defaultWeight,
        graphicKey: def.graphicKey,
        photoUrl: def.photoUrl
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseSets = (index: number, delta: number) => {
    setSelectedExercises(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, setsCount: Math.max(1, Math.min(8, item.setsCount + delta)) } : item
      )
    );
  };

  const updateExerciseReps = (index: number, reps: number) => {
    setSelectedExercises(prev =>
      prev.map((item, i) => (i === index ? { ...item, repsCount: Math.max(1, reps) } : item))
    );
  };

  const updateExerciseWeight = (index: number, weight: number) => {
    setSelectedExercises(prev =>
      prev.map((item, i) => (i === index ? { ...item, weight: Math.max(0, weight) } : item))
    );
  };

  const handleSave = () => {
    if (selectedExercises.length === 0) return;

    const newProg: WorkoutProgram = {
      id: existingProgram?.id || `custom_${Date.now()}`,
      name: programTitle.trim() || 'Моя тренировка',
      isCustom: true,
      exercises: selectedExercises
    };

    onSaveProgram(newProg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden border ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Конструктор тренировки</h2>
              <p className="text-xs text-neutral-400">Настройте свои упражнения, подходы и веса</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Program Title Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Название вашей тренировки
            </label>
            <input
              type="text"
              value={programTitle}
              onChange={e => setProgramTitle(e.target.value)}
              placeholder="Например: День ног и плеч"
              className={`w-full p-3 rounded-2xl text-base font-bold border transition-colors ${
                isDark ? 'bg-neutral-950 border-neutral-800 focus:border-primary-500' : 'bg-neutral-50 border-neutral-300 focus:border-primary-500'
              }`}
            />
          </div>

          {/* Selected Exercises List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Выбранные упражнения ({selectedExercises.length})
              </div>
              <button
                onClick={() => setShowCatalog(!showCatalog)}
                className="px-3 py-1.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {showCatalog ? 'Скрыть каталог' : 'Добавить упражнение'}
              </button>
            </div>

            {selectedExercises.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed rounded-2xl border-neutral-300 dark:border-neutral-800 text-neutral-400 text-xs">
                Пока не выбрано ни одного упражнения. Нажмите «Добавить упражнение» ниже.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedExercises.map((item, idx) => (
                  <div
                    key={`${item.exerciseId}_${idx}`}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                      isDark ? 'bg-neutral-950/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    {/* Left: Illustration + Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                        <ExerciseGraphic
                          graphicKey={item.graphicKey}
                          photoUrl={item.photoUrl}
                          exerciseName={item.name}
                          size="sm"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-neutral-400 block">Упражнение {idx + 1}</span>
                        <h4 className="font-bold text-sm sm:text-base leading-tight">{item.name}</h4>
                      </div>
                    </div>

                    {/* Right: Controls (Sets, Reps, Weight) */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      {/* Sets */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Сеты</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            onClick={() => updateExerciseSets(idx, -1)}
                            className="w-6 h-6 rounded-md bg-neutral-200 dark:bg-neutral-800 font-bold text-xs flex items-center justify-center hover:bg-neutral-300"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-black text-sm">{item.setsCount}</span>
                          <button
                            onClick={() => updateExerciseSets(idx, 1)}
                            className="w-6 h-6 rounded-md bg-neutral-200 dark:bg-neutral-800 font-bold text-xs flex items-center justify-center hover:bg-neutral-300"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Reps */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Повт</span>
                        <input
                          type="number"
                          value={item.repsCount}
                          onChange={e => updateExerciseReps(idx, Number(e.target.value) || 1)}
                          className="w-12 h-7 rounded-md border text-center font-bold text-xs mt-0.5 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                        />
                      </div>

                      {/* Weight */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Вес (кг)</span>
                        <input
                          type="number"
                          value={item.weight}
                          onChange={e => updateExerciseWeight(idx, Number(e.target.value) || 0)}
                          className="w-14 h-7 rounded-md border text-center font-bold text-xs mt-0.5 bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeExercise(idx)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors ml-1"
                        title="Удалить из программы"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exercise Catalog Selector (Expandable / Tabbed) */}
          {(showCatalog || selectedExercises.length === 0) && (
            <div className={`p-4 rounded-2xl border space-y-4 ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100/70 border-neutral-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  Библиотека упражнений с графикой
                </h3>
              </div>

              {/* Category pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      filterCategory === cat.id
                        ? 'bg-primary-500 text-white shadow-sm'
                        : isDark
                        ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                        : 'bg-white text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>

              {/* Exercise Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredLibrary.map(exercise => {
                  const isAdded = selectedExercises.some(e => e.exerciseId === exercise.id);

                  return (
                    <div
                      key={exercise.id}
                      onClick={() => !isAdded && addExercise(exercise)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                        isAdded
                          ? 'border-emerald-500/40 bg-emerald-500/10 opacity-75 cursor-default'
                          : isDark
                          ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0">
                          <ExerciseGraphic
                            graphicKey={exercise.graphicKey}
                            photoUrl={exercise.photoUrl}
                            exerciseName={exercise.name}
                            size="sm"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate leading-tight">{exercise.name}</div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {exercise.targetMuscles.join(', ')}
                          </div>
                        </div>
                      </div>

                      {isAdded ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-primary-500 hover:text-white flex items-center justify-center text-xs shrink-0 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div className="text-xs text-neutral-400 hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Программа сохранится навсегда
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-xs border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={selectedExercises.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs bg-primary-500 hover:bg-primary-600 text-white shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Зафиксировать и сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
