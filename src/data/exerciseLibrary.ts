export interface ExerciseDef {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  categoryTitle: string;
  graphicKey: string;
  photoUrl: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  targetMuscles: string[];
  tip: string;
}

export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // Грудь
  {
    id: 'bench_press',
    name: 'Жим штанги лёжа',
    category: 'chest',
    categoryTitle: 'Грудь',
    graphicKey: 'bench_press',
    photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 70,
    targetMuscles: ['Большие грудные', 'Передние дельты', 'Трицепс'],
    tip: 'Лопатки сведены, ноги упираются в пол, опускание на середину груди.'
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Жим гантелей под углом 30°',
    category: 'chest',
    categoryTitle: 'Грудь',
    graphicKey: 'incline_press',
    photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 24,
    targetMuscles: ['Верх груди', 'Плечи', 'Трицепс'],
    tip: 'Скамья под углом 30-45°, в верхней точке не ударяйте гантели друг о друга.'
  },
  {
    id: 'dips',
    name: 'Отжимания на брусьях',
    category: 'chest',
    categoryTitle: 'Грудь',
    graphicKey: 'dips',
    photoUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 0,
    targetMuscles: ['Низ груди', 'Трицепс', 'Плечевой пояс'],
    tip: 'Наклоните корпус немного вперёд, чтобы сместить нагрузку на грудь.'
  },
  {
    id: 'pushups',
    name: 'Классические отжимания',
    category: 'chest',
    categoryTitle: 'Грудь',
    graphicKey: 'pushups',
    photoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 0,
    targetMuscles: ['Грудные мышцы', 'Трицепс', 'Кор'],
    tip: 'Тело в одну прямую линию, пресс напряжен, касание грудью пола.'
  },

  // Спина
  {
    id: 'pullups',
    name: 'Подтягивания широким хватом',
    category: 'back',
    categoryTitle: 'Спина',
    graphicKey: 'pullups',
    photoUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 0,
    targetMuscles: ['Широчайшие мышцы спины', 'Бицепс', 'Предплечья'],
    tip: 'Тяните грудь к перекладине, сводя лопатки в верхней точке.'
  },
  {
    id: 'barbell_row',
    name: 'Тяга штанги в наклоне',
    category: 'back',
    categoryTitle: 'Спина',
    graphicKey: 'barbell_row',
    photoUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 60,
    targetMuscles: ['Широчайшие', 'Ромбовидные', 'Трапеции'],
    tip: 'Спина прямая под углом ~45°, тяга грифа строго к низу живота.'
  },
  {
    id: 'lat_pulldown',
    name: 'Тяга верхнего блока',
    category: 'back',
    categoryTitle: 'Спина',
    graphicKey: 'lat_pulldown',
    photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 55,
    targetMuscles: ['Широчайшие мышцы спины', 'Верх спины'],
    tip: 'Не отклоняйтесь сильно назад, движение за счет сокращения широчайших.'
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    category: 'back',
    categoryTitle: 'Спина',
    graphicKey: 'deadlift',
    photoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 6,
    defaultWeight: 90,
    targetMuscles: ['Разгибатели спины', 'Ягодицы', 'Задняя поверхность бедра'],
    tip: 'Гриф движется вплотную к голеням, спина строго прямая, без прогиба.'
  },

  // Ноги
  {
    id: 'barbell_squat',
    name: 'Приседания со штангой',
    category: 'legs',
    categoryTitle: 'Ноги',
    graphicKey: 'squat',
    photoUrl: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeight: 75,
    targetMuscles: ['Квадрицепсы', 'Ягодичные', 'Приводящие'],
    tip: 'Колени направлены по носкам, глубина до параллели или чуть ниже.'
  },
  {
    id: 'leg_press',
    name: 'Жим ногами в тренажере',
    category: 'legs',
    categoryTitle: 'Ноги',
    graphicKey: 'leg_press',
    photoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 12,
    defaultWeight: 140,
    targetMuscles: ['Квадрицепсы', 'Ягодичные'],
    tip: 'В верхней точке не вставляйте колени «до щелчка», держите мышцы под нагрузкой.'
  },
  {
    id: 'lunges',
    name: 'Выпады с гантелями',
    category: 'legs',
    categoryTitle: 'Ноги',
    graphicKey: 'lunges',
    photoUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 16,
    targetMuscles: ['Ягодицы', 'Квадрицепс', 'Баланс'],
    tip: 'Угол в коленях передней и задней ноги 90 градусов, корпус ровный.'
  },

  // Плечи
  {
    id: 'overhead_press',
    name: 'Армейский жим стоя',
    category: 'shoulders',
    categoryTitle: 'Плечи',
    graphicKey: 'overhead_press',
    photoUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeight: 45,
    targetMuscles: ['Передние и средние дельты', 'Трицепс'],
    tip: 'Пресс и ягодицы зажаты, гриф поднимается строго вверх над макушкой.'
  },
  {
    id: 'lateral_raises',
    name: 'Махи гантелями в стороны',
    category: 'shoulders',
    categoryTitle: 'Плечи',
    graphicKey: 'lateral_raises',
    photoUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 4,
    defaultReps: 15,
    defaultWeight: 10,
    targetMuscles: ['Средняя дельта'],
    tip: 'Локти чуть согнуты и слегка выше кистей, без рывков корпусом.'
  },

  // Руки
  {
    id: 'bicep_curl',
    name: 'Подъем штанги на бицепс',
    category: 'arms',
    categoryTitle: 'Руки',
    graphicKey: 'bicep_curl',
    photoUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 30,
    targetMuscles: ['Двуглавая мышца плеча (Бицепс)'],
    tip: 'Локти зафиксированы у корпуса, не раскачивайтесь поясницей.'
  },
  {
    id: 'tricep_pushdown',
    name: 'Разгибание на трицепс в блоке',
    category: 'arms',
    categoryTitle: 'Руки',
    graphicKey: 'tricep_pushdown',
    photoUrl: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 25,
    targetMuscles: ['Трицепс (все 3 головки)'],
    tip: 'Полное разгибание внизу с пиковым сокращением на секунду.'
  },

  // Кор & Пресс
  {
    id: 'abs_crunches',
    name: 'Скручивания на пресс',
    category: 'core',
    categoryTitle: 'Пресс',
    graphicKey: 'crunches',
    photoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 20,
    defaultWeight: 0,
    targetMuscles: ['Прямая мышца живота'],
    tip: 'Не тяните себя за шею, концентрируйтесь на приближении ребер к тазу.'
  },
  {
    id: 'hanging_leg_raises',
    name: 'Подъемы ног в висе на турнике',
    category: 'core',
    categoryTitle: 'Пресс',
    graphicKey: 'hanging_legs',
    photoUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=800&h=600&q=85',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeight: 0,
    targetMuscles: ['Нижний отдел пресса', 'Подвздошно-поясничная'],
    tip: 'Поднимайте ноги или колени плавно без раскачки тела.'
  }
];

export interface CustomExerciseItem {
  exerciseId: string;
  name: string;
  setsCount: number;
  repsCount: number;
  weight: number;
  graphicKey: string;
  photoUrl?: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  isCustom?: boolean;
  exercises: CustomExerciseItem[];
}

export const DEFAULT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'chest_tri',
    name: '💪 Грудь & Трицепс',
    exercises: [
      { exerciseId: 'bench_press', name: 'Жим штанги лёжа', setsCount: 4, repsCount: 10, weight: 70, graphicKey: 'bench_press', photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'incline_dumbbell_press', name: 'Жим гантелей под углом 30°', setsCount: 3, repsCount: 12, weight: 24, graphicKey: 'incline_press', photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'dips', name: 'Отжимания на брусьях', setsCount: 3, repsCount: 12, weight: 0, graphicKey: 'dips', photoUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'tricep_pushdown', name: 'Разгибание на трицепс в блоке', setsCount: 3, repsCount: 12, weight: 25, graphicKey: 'tricep_pushdown', photoUrl: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=800&h=600&q=85' }
    ]
  },
  {
    id: 'back_bi',
    name: '🧗 Спина & Бицепс',
    exercises: [
      { exerciseId: 'pullups', name: 'Подтягивания широким хватом', setsCount: 4, repsCount: 8, weight: 0, graphicKey: 'pullups', photoUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'barbell_row', name: 'Тяга штанги в наклоне', setsCount: 4, repsCount: 10, weight: 60, graphicKey: 'barbell_row', photoUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'lat_pulldown', name: 'Тяга верхнего блока', setsCount: 3, repsCount: 12, weight: 55, graphicKey: 'lat_pulldown', photoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'bicep_curl', name: 'Подъем штанги на бицепс', setsCount: 3, repsCount: 12, weight: 30, graphicKey: 'bicep_curl', photoUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&h=600&q=85' }
    ]
  },
  {
    id: 'legs_shoulders',
    name: '🦵 Ноги & Плечи',
    exercises: [
      { exerciseId: 'barbell_squat', name: 'Приседания со штангой', setsCount: 4, repsCount: 10, weight: 75, graphicKey: 'squat', photoUrl: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'leg_press', name: 'Жим ногами в тренажере', setsCount: 4, repsCount: 12, weight: 140, graphicKey: 'leg_press', photoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'overhead_press', name: 'Армейский жим стоя', setsCount: 4, repsCount: 8, weight: 45, graphicKey: 'overhead_press', photoUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'lateral_raises', name: 'Махи гантелями в стороны', setsCount: 3, repsCount: 15, weight: 10, graphicKey: 'lateral_raises', photoUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&h=600&q=85' }
    ]
  },
  {
    id: 'fullbody_treny',
    name: '⚡ Фуллбоди Классика',
    exercises: [
      { exerciseId: 'pullups', name: 'Подтягивания', setsCount: 3, repsCount: 10, weight: 0, graphicKey: 'pullups', photoUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'barbell_squat', name: 'Приседания', setsCount: 4, repsCount: 12, weight: 70, graphicKey: 'squat', photoUrl: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'bench_press', name: 'Жим лёжа', setsCount: 4, repsCount: 10, weight: 65, graphicKey: 'bench_press', photoUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&h=600&q=85' },
      { exerciseId: 'abs_crunches', name: 'Пресс', setsCount: 3, repsCount: 20, weight: 0, graphicKey: 'crunches', photoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&h=600&q=85' }
    ]
  }
];

export function getExercisePhotoUrl(exerciseIdOrKey: string): string {
  const byId = EXERCISE_LIBRARY.find(e => e.id === exerciseIdOrKey);
  if (byId) return byId.photoUrl;
  const byKey = EXERCISE_LIBRARY.find(e => e.graphicKey === exerciseIdOrKey);
  if (byKey) return byKey.photoUrl;
  // Default dark gym aesthetic photo
  return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&h=600&q=85';
}
