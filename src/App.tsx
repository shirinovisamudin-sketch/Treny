import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, Timer, Info, Trophy, Settings, Palette, User, LogOut, Save } from 'lucide-react';
import { addRepsToLeaderboard } from './lib/firebase';
import { Leaderboard } from './components/Leaderboard';

function ColorPickerField({ hsv, setHsv }: { hsv: {h:number, s:number, v:number}, setHsv: React.Dispatch<React.SetStateAction<{h:number, s:number, v:number}>>}) {
  const svRef = useRef<HTMLDivElement>(null);
  const [isDraggingSV, setIsDraggingSV] = useState(false);

  const updateSV = (clientX: number, clientY: number) => {
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);
    setHsv(prev => ({ ...prev, s, v }));
  };

  const v_val = hsv.v / 100;
  const s_val = hsv.s / 100;
  const l_val = v_val * (1 - s_val / 2);
  const sl_val = (l_val === 0 || l_val === 1) ? 0 : (v_val - l_val) / Math.min(l_val, 1 - l_val);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div 
        ref={svRef}
        onPointerDown={(e) => {
          setIsDraggingSV(true);
          (e.target as Element).setPointerCapture(e.pointerId);
          updateSV(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (isDraggingSV) {
            updateSV(e.clientX, e.clientY);
          }
        }}
        onPointerUp={(e) => {
          setIsDraggingSV(false);
          (e.target as Element).releasePointerCapture(e.pointerId);
        }}
        className="w-full aspect-square rounded-xl cursor-crosshair relative shadow-inner overflow-hidden border border-neutral-200 dark:border-neutral-700 touch-none"
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,1), transparent), linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0))`
        }}
      >
        <div 
          className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-[0_1px_3px_rgba(0,0,0,0.5)] pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: `hsl(${hsv.h}, ${sl_val * 100}%, ${l_val * 100}%)`
          }}
        />
      </div>
      
      <input
        type="range"
        min="0"
        max="360"
        value={hsv.h}
        onChange={(e) => setHsv(prev => ({ ...prev, h: parseInt(e.target.value) }))}
        className="w-full h-4 rounded-full appearance-none outline-none custom-hue-slider shadow-inner border border-neutral-200 dark:border-neutral-700"
        style={{
          background: `linear-gradient(to right, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #00ff00 37.5%, #00ffff 50%, #0000ff 62.5%, #8000ff 75%, #ff00ff 87.5%, #ff0000 100%)`
        }}
      />
    </div>
  );
}

export default function App() {
  const [gridState, setGridState] = useState<boolean[][]>([
    [false, false, false, false],
    [false, false, false, false],
    [false, false, false, false],
    [false, false, false, false],
  ]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimerTime, setTotalTimerTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [repsPerSet, setRepsPerSet] = useState<number>(12);

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [styleMode, setStyleMode] = useState<'adult' | 'kids' | 'retro' | 'slime'>('adult');
  const [deviceType, setDeviceType] = useState<'computer' | 'tablet' | 'phone'>('phone');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const [customRestSeconds, setCustomRestSeconds] = useState<number>(25);

  const [hsv, setHsv] = useState({ h: 24, s: 100, v: 100 }); // Default base color (orangeish)

  const [isRgb, setIsRgb] = useState<boolean>(() => {
    return localStorage.getItem('treny_is_rgb') === 'true';
  });
  const [isBacklight, setIsBacklight] = useState<boolean>(() => {
    return localStorage.getItem('treny_is_backlight') === 'true';
  });
  const [isRainbow, setIsRainbow] = useState<boolean>(() => {
    return localStorage.getItem('treny_is_rainbow') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('treny_is_rgb', isRgb ? 'true' : 'false');
  }, [isRgb]);

  useEffect(() => {
    localStorage.setItem('treny_is_backlight', isBacklight ? 'true' : 'false');
  }, [isBacklight]);

  useEffect(() => {
    localStorage.setItem('treny_is_rainbow', isRainbow ? 'true' : 'false');
  }, [isRainbow]);

  useEffect(() => {
    if (!isRainbow) return;
    const interval = setInterval(() => {
      setHsv(prev => {
        const nextH = (prev.h + 2) % 360;
        return { ...prev, h: nextH };
      });
    }, 45);
    return () => clearInterval(interval);
  }, [isRainbow]);

  const settingsRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const endTimeRef = useRef<number | null>(null);

  const [localProfile, setLocalProfile] = useState<{id: string, name: string} | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [syncedRepsForSession, setSyncedRepsForSession] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const [gameState, setGameState] = useState({
    coins: 0,
    unlockedReps: false,
    unlockedRest: false,
    unlockedMultipleSyncs: false,
    syncsToday: 0,
    lastSyncDate: new Date().toLocaleDateString('en-CA'),
    completedReps: 0,
    lastCoinDate: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('treny_profile');
    if (saved) {
      try {
        setLocalProfile(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('treny_gamestate');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const today = new Date().toLocaleDateString('en-CA');
        if (parsed.lastSyncDate !== today) {
          parsed.syncsToday = 0;
          parsed.lastSyncDate = today;
        }
        setGameState(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('treny_gamestate', JSON.stringify(gameState));
  }, [gameState]);

  const handleSaveName = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName || trimmedName.length > 15) {
      alert('Имя должно быть от 1 до 15 символов.');
      return;
    }
    
    const badRoots = ['хуй', 'пизд', 'еба', 'ебл', 'бля', 'сука', 'cyka', 'blyat', 'fuck', 'мудак', 'хер', 'шлюха', 'залуп', 'дроч', 'пидар', 'пидор', 'гандон', 'говно'];
    const lowerName = trimmedName.toLowerCase().replace(/\s+/g, '');
    for (const root of badRoots) {
      if (lowerName.includes(root)) {
        alert('Имя содержит недопустимые слова.');
        return;
      }
    }

    const newProfile = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      name: trimmedName
    };
    localStorage.setItem('treny_profile', JSON.stringify(newProfile));
    setLocalProfile(newProfile);
  };

  const handleLogoutName = () => {
    localStorage.removeItem('treny_profile');
    setLocalProfile(null);
  };

  const rows = ['Верх 🔼', 'Вниз 🔽', 'Верх 🔼', 'Вниз 🔽'];

  // Theme resolution
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Click outside to close custom popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setPaletteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initAudioAndNotifications = () => {
    // 1. Инициализация AudioContext по клику пользователя (необходимо для мобильных Safari/Chrome)
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    // 2. Запрос на отправку уведомлений
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const playTimerSound = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      const playBeep = (timeOffset: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        // Увеличиваем пиковую громкость с 0.2 до 0.8
        gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + timeOffset + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.4);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.4);
      };

      // Проигрываем тройной сигнал (похоже на фитнес-таймер)
      playBeep(0, 880);
      playBeep(0.2, 880);
      playBeep(0.4, 1046.50); // Последний звук чуть выше (нота До)

      // Отправляем push-уведомление, если есть права
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Отдых окончен!', {
          body: 'Пора приступить к следующему подходу.',
          icon: '/favicon.ico'
        });
      }
    } catch (e) {
      console.error('Не удалось воспроизвести звук таймера', e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const tick = () => {
      if (!timerActive || !endTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining === 0) {
        setTimerActive(false);
        endTimeRef.current = null;
        playTimerSound();
      }
    };

    if (timerActive) {
      tick(); // Вызываем сразу на случай, если таймер был в фоне
      interval = setInterval(tick, 500); // 500ms для большей отзывчивости
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive]);

  // Обработка возврата из фонового режима (помогает сразу перерисовать UI)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerActive && endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setTimerActive(false);
          endTimeRef.current = null;
          playTimerSound();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerActive]);

  const toggleCell = (rowIdx: number, colIdx: number) => {
    const newGrid = [...gridState];
    newGrid[rowIdx] = [...newGrid[rowIdx]];
    newGrid[rowIdx][colIdx] = !newGrid[rowIdx][colIdx];
    setGridState(newGrid);
  };

  const startTimer = (seconds: number) => {
    initAudioAndNotifications();
    setTimeLeft(seconds);
    setTotalTimerTime(seconds);
    setTimerActive(true);
    endTimeRef.current = Date.now() + seconds * 1000;
  };

  const toggleTimer = () => {
    initAudioAndNotifications();
    if (timeLeft > 0) {
      if (!timerActive) {
        // Возобновляем: пересчитываем целевое время окончания
        endTimeRef.current = Date.now() + timeLeft * 1000;
        setTimerActive(true);
      } else {
        // Ставим на паузу
        endTimeRef.current = null;
        setTimerActive(false);
      }
    }
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(0);
    setTotalTimerTime(0);
    endTimeRef.current = null;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const checkedCount = gridState.flat().filter(Boolean).length;
  const currentRepsForUI = checkedCount * Math.max(6, repsPerSet);
  const totalTargetReps = 16 * Math.max(6, repsPerSet);
  const totalCurrentReps = gameState.completedReps + currentRepsForUI;
  const isFinished = checkedCount === 16;
  const repPercentage = totalTargetReps > 0 ? Math.round((currentRepsForUI / totalTargetReps) * 100) : 0;

  const timerProgress = totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0;

  const handleFinishWorkout = () => {
    const today = new Date().toLocaleDateString('en-CA');
    const canGetCoins = gameState.lastCoinDate !== today;

    setGameState(prev => ({
      ...prev,
      coins: prev.coins + (canGetCoins ? 5 : 0),
      lastCoinDate: canGetCoins ? today : prev.lastCoinDate,
      completedReps: prev.completedReps + totalTargetReps
    }));
    // Возвращаем сетку в начальное состояние
    setGridState([
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ]);
  };

  const handleSyncToLeaderboard = async () => {
    if (!localProfile) return;
    
    const today = new Date().toLocaleDateString('en-CA');
    let currentSyncs = gameState.syncsToday;
    if (gameState.lastSyncDate !== today) {
        currentSyncs = 0;
    }
    
    const maxSyncs = gameState.unlockedMultipleSyncs ? 5 : 1;
    if (currentSyncs >= maxSyncs) {
        alert(`Лимит синхронизаций на сегодня исчерпан (${maxSyncs} из ${maxSyncs}).\nВы можете купить расширение лимитов за монеты.`);
        return;
    }

    const repsToSync = totalCurrentReps - syncedRepsForSession;
    if (repsToSync <= 0) return;
    
    setIsSyncing(true);
    try {
      await addRepsToLeaderboard(localProfile.id, localProfile.name, repsToSync);
      setSyncedRepsForSession(totalCurrentReps);
      setGameState(prev => ({
          ...prev,
          lastSyncDate: today,
          syncsToday: currentSyncs + 1
      }));
    } catch (error) {
      console.error('Failed to sync', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // -- Dynamic Styling Helpers (Manual Dark Mode Mapping for safety) --

  const isDark = resolvedTheme === 'dark';

  const getContainerStyles = () => {
    const base = isDark ? 'bg-neutral-800' : 'bg-white';
    let styles = '';
    if (styleMode === 'kids') {
      styles = `${base} rounded-3xl shadow-lg border-[6px] ${isDark ? 'border-primary-900' : 'border-primary-100'}`;
    } else if (styleMode === 'retro') {
      styles = `${base} rounded-none border-4 ${isDark ? 'border-neutral-500 shadow-[8px_8px_0px_0px_rgba(115,115,115,1)]' : 'border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`;
    } else if (styleMode === 'slime') {
      styles = `${base} rounded-[2rem_1rem_2.5rem_1.5rem] border-4 ${isDark ? 'border-green-600 shadow-[0_8px_32px_rgba(34,197,94,0.3)] bg-neutral-900/90' : 'border-green-400 bg-green-50/20 shadow-[0_8px_32px_rgba(74,222,128,0.2)]'}`;
    } else {
      styles = `${base} rounded-2xl shadow-sm border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`;
    }
    if (isRgb) {
      styles += ' rgb-neon-card';
    } else if (isBacklight) {
      styles += ' backlight-card';
    }
    return styles;
  };

  const getButtonStyles = () => {
    let styles = '';
    if (styleMode === 'kids') {
      styles = 'rounded-2xl border-b-[6px] active:border-b-0 active:translate-y-1.5';
    } else if (styleMode === 'retro') {
      styles = 'rounded-none border-2';
    } else if (styleMode === 'slime') {
      styles = 'rounded-[1.2rem_0.8rem_1.5rem_0.9rem] border-b-4 border-green-500 hover:bg-green-100/10 active:border-b-0 active:translate-y-1';
    } else {
      styles = 'rounded-xl';
    }
    if (isRgb) {
      styles += ' rgb-neon-btn';
    } else if (isBacklight) {
      styles += ' backlight-btn';
    }
    return styles;
  };

  const fontClass = styleMode === 'retro' ? 'font-mono' : styleMode === 'slime' ? 'font-sans text-[1.02rem] tracking-tight' : styleMode === 'kids' ? 'font-sans text-[1.05rem] tracking-wide' : 'font-sans';
  const rootClass = `${isDark ? 'bg-neutral-900 text-neutral-100' : 'bg-primary-50 text-neutral-900'} min-h-screen p-4 md:p-8 transition-colors duration-300 ${fontClass}`;

  const borderClass = isDark ? 'border-neutral-600' : 'border-primary-200';
  const mutedTextClass = isDark ? 'text-neutral-400' : 'text-primary-800/60';
  const darkCardBg = isDark ? 'bg-neutral-700' : 'bg-primary-50/50';

  // Calculate CSS Custom Properties for Main Hue
  const v_val = hsv.v / 100;
  const s_val = hsv.s / 100;
  const l_val = v_val * (1 - s_val / 2);
  const sl_val = (l_val === 0 || l_val === 1) ? 0 : (v_val - l_val) / Math.min(l_val, 1 - l_val);

  const cssH = hsv.h;
  const cssS = sl_val * 100;
  const cssL = l_val * 100;

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-h', cssH.toString());
    document.documentElement.style.setProperty('--theme-s', `${cssS}%`);
    document.documentElement.style.setProperty('--theme-l', `${cssL}%`);
  }, [cssH, cssS, cssL]);

  const getDeviceContainerClass = () => {
    if (deviceType === 'phone') return 'max-w-[360px] sm:max-w-md';
    if (deviceType === 'tablet') return 'max-w-2xl';
    return 'max-w-4xl';
  };

  const isPhone = deviceType === 'phone';

  return (
    <div className={rootClass}>
      <div className={`mx-auto space-y-4 sm:space-y-6 relative transition-all duration-300 ${getDeviceContainerClass()}`}>
        
        {/* Header */}
        <header className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 p-4 md:p-6 relative z-50 ${getContainerStyles()}`}>
          <div>
            <h1 className={`${isPhone ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight ${isRainbow ? 'rainbow-text' : 'text-primary-500'} ${styleMode === 'retro' ? 'uppercase' : ''}`}>
              {styleMode === 'kids' ? '🤸‍♂️ Треня!' : styleMode === 'slime' ? '🤢 Слизневая Треня!' : 'Тренировка'}
            </h1>
            <p className={`${mutedTextClass} mt-1 ${isPhone ? 'text-sm' : ''}`}>Отслеживание подходов и отдыха</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex flex-1 items-center gap-2 md:gap-3 ${isDark ? 'bg-primary-950 border-primary-800' : 'bg-primary-50 border-primary-100'} px-3 md:px-4 py-2 border ${getButtonStyles()} justify-center md:justify-start`}>
              <Trophy className={`${isPhone ? 'w-4 h-4' : 'w-5 h-5'} ${isFinished ? 'text-green-500' : 'text-primary-400'}`} />
              <div className={`${isPhone ? 'text-xs' : 'text-sm'} font-medium whitespace-nowrap`}>
                <span className={mutedTextClass}>Сделано: </span>
                <span className={`text-base md:text-lg font-bold ${isFinished ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-primary-400' : 'text-primary-600')}`}>
                  {currentRepsForUI} ({repPercentage}%)
                </span>
                <span className={mutedTextClass}> / {totalTargetReps} р.</span>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 border border-yellow-200 dark:border-yellow-700/50 mr-1" style={{ borderRadius: styleMode === 'retro' ? '0' : '0.75rem' }}>
              <span className="text-xl leading-none">🪙</span>
              <span className="text-sm md:text-base">{gameState.coins}</span>
            </div>

            <div className="flex gap-2 relative">
              {/* Palette Dropdown */}
              <div className="relative" ref={paletteRef}>
                <button 
                  onClick={() => { setPaletteOpen(!paletteOpen); setSettingsOpen(false); }}
                  className={`px-3 md:px-4 py-2 ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'} flex items-center gap-2 font-medium transition-colors ${styleMode === 'retro' ? 'border-2 border-black dark:border-neutral-500 rounded-none' : 'rounded-xl border border-transparent'}`}
                  aria-label="Оформление"
                >
                  <Palette className={isPhone ? "w-4 h-4" : "w-5 h-5"} />
                  {!isPhone && <span className="hidden sm:inline">Оформление</span>}
                </button>
                
                {paletteOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-72 p-4 z-50 ${isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-neutral-200'} border ${styleMode === 'retro' ? 'rounded-none' : 'rounded-2xl shadow-xl'}`}>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                      <h3 className="font-bold">Выбор цвета</h3>
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shadow-sm" 
                        style={{ backgroundColor: `hsl(${cssH}, ${cssS}%, ${cssL}%)` }} 
                        aria-label="Выбранный цвет"
                      />
                    </div>
                    <ColorPickerField hsv={hsv} setHsv={setHsv} />
                    
                    <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Спецэффекты</h4>
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIsRgb(!isRgb);
                              if (!isRgb) setIsBacklight(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-sm font-bold border transition-all ${
                              isRgb 
                                ? 'bg-neutral-900 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:hover:bg-neutral-700 dark:text-neutral-300'
                            } ${getButtonStyles()}`}
                          >
                            <span className={isRgb ? "animate-bounce" : ""}>✨</span> RGB
                          </button>
                          <button
                            onClick={() => {
                              setIsRainbow(!isRainbow);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-sm font-bold border transition-all ${
                              isRainbow 
                                ? 'rainbow-bg shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:hover:bg-neutral-700 dark:text-neutral-300'
                            } ${getButtonStyles()}`}
                          >
                            🌈 Радуга
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setIsBacklight(!isBacklight);
                            if (!isBacklight) setIsRgb(false);
                          }}
                          style={{
                            borderColor: isBacklight ? `hsl(${cssH}, ${cssS}%, ${cssL}%)` : 'transparent',
                            boxShadow: isBacklight ? `0 0 10px hsl(${cssH}, ${cssS}%, ${cssL}%, 0.6)` : 'none'
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 text-sm font-bold border transition-all ${
                            isBacklight
                              ? 'bg-neutral-900 bg-opacity-95'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:hover:bg-neutral-700 dark:text-neutral-300'
                          } ${getButtonStyles()}`}
                        >
                          <span 
                            className="inline-block w-3.5 h-3.5 rounded-full border border-white shrink-0 shadow-sm"
                            style={{ backgroundColor: `hsl(${cssH}, ${cssS}%, ${cssL}%)` }}
                          />
                          <span style={{ color: isBacklight ? `hsl(${cssH}, ${cssS}%, ${cssL}%)` : 'inherit' }}>
                            Подсветка {isBacklight && '(вкл.)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => { setSettingsOpen(!settingsOpen); setPaletteOpen(false); }}
                  className={`p-2 md:p-3 ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'} transition-colors ${styleMode === 'retro' ? 'border-2 border-black dark:border-neutral-500 rounded-none' : 'rounded-xl border border-transparent'}`}
                  aria-label="Настройки"
                >
                  <Settings className={isPhone ? "w-4 h-4" : "w-5 h-5"} />
                </button>
                
                {settingsOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-64 p-4 z-50 ${isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-white border-neutral-200'} border ${getContainerStyles()}`}>
                    <h3 className={`font-bold mb-3 border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'} pb-2`}>Настройки</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <span className={`text-sm font-medium ${mutedTextClass} mb-2 block`}>Стиль</span>
                        <div className="flex flex-col gap-2">
                          {(['kids', 'adult', 'retro', 'slime'] as const).map(s => {
                            const isActive = styleMode === s;
                            return (
                              <button
                                key={s}
                                onClick={() => setStyleMode(s)}
                                className={`text-left px-3 py-2 text-sm ${getButtonStyles()} transition-colors border ${
                                  isActive 
                                    ? (isDark ? 'bg-primary-900 opacity-90 text-primary-300 border-primary-500' : 'bg-primary-100 text-primary-700 border-primary-500') 
                                    : (isDark ? 'bg-neutral-700 text-neutral-200 border-transparent hover:bg-neutral-600' : 'bg-neutral-50 text-neutral-700 border-transparent hover:bg-neutral-100')
                                }`}
                              >
                                {s === 'kids' ? '🎈 Детский' : s === 'adult' ? '👔 Обычный' : s === 'retro' ? '🕹️ Ретро' : '🤢 Слизневый'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className={`text-sm font-medium ${mutedTextClass} mb-2 block`}>Темы</span>
                        <div className="flex flex-col gap-2">
                          {(['dark', 'light', 'system'] as const).map(t => {
                            const isActive = theme === t;
                            return (
                              <button
                                key={t}
                                onClick={() => setTheme(t)}
                                className={`text-left px-3 py-2 text-sm ${getButtonStyles()} transition-colors border ${
                                  isActive 
                                    ? (isDark ? 'bg-blue-900 opacity-90 text-blue-300 border-blue-500' : 'bg-blue-100 text-blue-700 border-blue-500') 
                                    : (isDark ? 'bg-neutral-700 text-neutral-200 border-transparent hover:bg-neutral-600' : 'bg-neutral-50 text-neutral-700 border-transparent hover:bg-neutral-100')
                                }`}
                              >
                                {t === 'dark' ? '🌙 Тёмный' : t === 'light' ? '☀️ Светлый' : '💻 Системный'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <span className={`text-sm font-medium ${mutedTextClass} mb-2 block`}>Устройство</span>
                        <div className="flex flex-col gap-2">
                          {(['phone', 'tablet', 'computer'] as const).map(d => {
                            const isActive = deviceType === d;
                            return (
                              <button
                                key={d}
                                onClick={() => setDeviceType(d)}
                                className={`text-left px-3 py-2 text-sm ${getButtonStyles()} transition-colors border ${
                                  isActive 
                                    ? (isDark ? 'bg-primary-900 opacity-90 text-primary-300 border-primary-500' : 'bg-primary-100 text-primary-700 border-primary-500') 
                                    : (isDark ? 'bg-neutral-700 text-neutral-200 border-transparent hover:bg-neutral-600' : 'bg-neutral-50 text-neutral-700 border-transparent hover:bg-neutral-100')
                                }`}
                              >
                                {d === 'phone' ? '📱 Телефон' : d === 'tablet' ? '📟 Планшет' : '🖥️ Компьютер'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Main Table Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            <div className={`overflow-hidden ${getContainerStyles()}`}>
              <div className={`p-3 md:p-4 ${darkCardBg} border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                <h2 className={`${isPhone ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
                  Таблица подходов
                </h2>
              </div>
              
              <div className={`${isPhone ? 'p-2' : 'p-4 md:p-6'} overflow-x-auto`}>
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className={`p-1 md:p-3 border-2 ${borderClass} ${mutedTextClass} font-medium ${isPhone ? 'text-xs' : ''}`}>Подход</th>
                      {[1, 2, 3, 4].map(num => (
                        <th key={num} className={`p-1 md:p-3 border-2 ${borderClass} text-primary-500 font-bold ${isPhone ? 'text-base' : 'text-xl'}`}>
                          <div className={`${isPhone ? 'w-8 h-8' : 'w-10 h-10'} border-2 border-primary-400 flex items-center justify-center mx-auto ${getButtonStyles()} ${isDark ? 'bg-neutral-800' : ''}`}>
                            {num}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((rowLabel, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className={`p-2 lg:p-4 border-2 ${borderClass} font-medium text-left whitespace-nowrap ${isPhone ? 'text-xs sm:text-sm' : 'text-lg'}`}>
                          {rowLabel}
                        </td>
                        {[0, 1, 2, 3].map(colIdx => {
                          const isChecked = gridState[rowIdx][colIdx];
                          return (
                            <td key={colIdx} className={`p-0.5 sm:p-1 lg:p-2 border-2 ${borderClass}`}>
                              <button
                                onClick={() => toggleCell(rowIdx, colIdx)}
                                className={`mx-auto flex items-center justify-center transition-all duration-200 outline-none ${getButtonStyles()} ${
                                  isChecked 
                                    ? (isDark ? 'bg-green-900 opacity-90 border border-green-500 text-green-400' : 'bg-green-100 border border-green-500 text-green-600 shadow-inner') 
                                    : (isDark ? 'bg-neutral-800 border-[1.5px] border-dashed border-neutral-600 text-transparent hover:border-neutral-500 hover:bg-neutral-700' : 'bg-neutral-50 border-[1.5px] border-dashed border-neutral-300 text-transparent hover:border-neutral-400 hover:bg-neutral-100')
                                } ${styleMode === 'retro' ? '!border-solid' : ''} ${isPhone ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-14 h-14 md:w-16 md:h-16'}`}
                                aria-label={`Toggle row ${rowLabel} column ${colIdx + 1}`}
                              >
                                {isChecked && <Check className={`${isPhone ? 'w-5 h-5' : 'w-8 h-8'}`} strokeWidth={styleMode === 'kids' ? 4 : 3} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isFinished && (
                <div className="p-4 flex justify-center animate-in fade-in">
                  <button 
                    onClick={handleFinishWorkout}
                    className={`px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex items-center gap-2 shadow-lg ${getButtonStyles()}`}
                  >
                    Завершить тренировку {gameState.lastCoinDate !== new Date().toLocaleDateString('en-CA') && "(+5 🪙)"}
                  </button>
                </div>
              )}
            </div>

            {/* Set Configuration */}
            <div className={`p-4 md:p-6 relative overflow-hidden ${getContainerStyles()}`}>
              {styleMode !== 'retro' && (
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-500 opacity-80"></div>
              )}
              <h2 className={`${isPhone ? 'text-base' : 'text-xl'} font-bold text-primary-500 uppercase flex items-center gap-2 mb-3 md:mb-4 ${styleMode !== 'retro' ? 'ml-2' : ''}`}>
                Настройка подходов
              </h2>
              {gameState.unlockedReps ? (
                <div className={`font-medium ${isPhone ? 'text-sm' : 'text-lg'} ${styleMode !== 'retro' ? 'ml-2' : ''} flex flex-col gap-4`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label htmlFor="repsInput" className="text-neutral-700 dark:text-neutral-300">
                      Количество повторений за 1 подход:
                    </label>
                    <input
                      id="repsInput"
                      type="number"
                      min="6"
                      max="500"
                      value={repsPerSet || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setRepsPerSet(0);
                          return;
                        }
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) return;
                        if (val > 500) val = 500;
                        setRepsPerSet(val);
                      }}
                      onBlur={() => {
                          if (!repsPerSet || repsPerSet < 6) setRepsPerSet(6);
                      }}
                      className={`w-20 px-2 py-1 text-center font-bold outline-none ring-2 focus:ring-primary-500 ${isDark ? 'ring-primary-900 bg-primary-950 text-white' : 'ring-primary-200 bg-primary-50'} ${getButtonStyles()}`}
                    />
                  </div>
                </div>
              ) : (
                <div className={`flex items-center justify-between gap-3 flex-wrap p-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${getButtonStyles()}`}>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">🔒 Настройка количества раз</span>
                  <button
                    disabled={gameState.coins < 10}
                    onClick={() => {
                      if (gameState.coins >= 10) {
                        setGameState(p => ({...p, coins: p.coins - 10, unlockedReps: true}));
                      }
                    }}
                    className={`px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-sm disabled:opacity-50 ${getButtonStyles()}`}
                  >
                    Разблокировать (10 🪙)
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar: Timers */}
          <div className="space-y-4 md:space-y-6">
            
            <div className={`p-4 md:p-6 flex flex-col items-center ${getContainerStyles()}`}>
              <Timer className={`${isPhone ? 'w-6 h-6' : 'w-8 h-8'} ${styleMode === 'kids' ? 'text-primary-400' : mutedTextClass} mb-2`} />
              <h2 className={`${isPhone ? 'text-base' : 'text-lg'} font-semibold mb-4 md:mb-6 text-center`}>
                {styleMode === 'kids' ? 'Время отдыхать!' : 'Таймер отдыха'}
              </h2>
              
              <div className={`relative ${isPhone ? 'w-36 h-36 mb-6' : 'w-48 h-48 mb-8'} flex flex-col items-center justify-center`}>
                <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="96" cy="96" r="88"
                    className={isDark ? 'stroke-neutral-700' : 'stroke-neutral-100'}
                    strokeWidth={styleMode === 'retro' ? 4 : 12} fill="none"
                  />
                  <circle
                    cx="96" cy="96" r="88"
                    className="stroke-primary-500 transition-all duration-1000 ease-linear"
                    strokeWidth={styleMode === 'retro' ? 12 : 12} fill="none" 
                    strokeLinecap={styleMode === 'retro' ? "butt" : "round"}
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - timerProgress / 100)}
                  />
                </svg>
                <div className={`z-10 ${isPhone ? 'text-4xl' : 'text-5xl'} tracking-tighter font-bold ${styleMode === 'retro' ? 'font-mono' : 'font-mono'}`}>
                  {formatTime(timeLeft)}
                </div>
                {timeLeft === 0 && totalTimerTime > 0 && (
                  <div className={`z-10 ${isPhone ? 'text-xs' : 'text-sm'} font-medium text-green-500 mt-1 animate-pulse`}>
                    Время вышло!
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-4 md:mb-6 w-full max-w-[200px]">
                <button
                  onClick={toggleTimer}
                  disabled={timeLeft === 0 && totalTimerTime === 0}
                  className={`flex-1 ${isDark ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-300' : 'bg-neutral-900 text-white hover:bg-neutral-800'} py-2 md:py-3 flex items-center justify-center transition-colors ${getButtonStyles()}`}
                >
                  {timerActive ? <Pause className={`fill-current ${isPhone ? 'w-4 h-4' : 'w-5 h-5'}`} /> : <Play className={`fill-current ${isPhone ? 'w-4 h-4' : 'w-5 h-5'}`} />}
                </button>
                <button
                  onClick={resetTimer}
                  className={`px-3 md:px-4 bg-neutral-200 dark:bg-neutral-700 ${mutedTextClass} dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors ${getButtonStyles()}`}
                  aria-label="Сбросить таймер"
                >
                  <RotateCcw className={isPhone ? 'w-4 h-4' : 'w-5 h-5'} />
                </button>
              </div>

              <div className="space-y-4 w-full">
                {gameState.unlockedRest ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="customTimerInput" className={`${isPhone ? 'text-xs' : 'text-sm'} ${mutedTextClass} font-medium text-center`}>
                      Время отдыха (сек):
                    </label>
                    <input
                      id="customTimerInput"
                      type="number"
                      min="10"
                      max="60"
                      value={customRestSeconds || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setCustomRestSeconds(0);
                          return;
                        }
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) return;
                        if (val > 60) val = 60;
                        setCustomRestSeconds(val);
                      }}
                      onBlur={() => {
                        if (!customRestSeconds || customRestSeconds < 10) setCustomRestSeconds(10);
                      }}
                      className={`w-full px-3 py-2 text-center text-lg font-bold outline-none ring-2 focus:ring-primary-500 ${isDark ? 'ring-primary-900 bg-primary-950 text-white' : 'ring-primary-200 bg-primary-50'} ${getButtonStyles()}`}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center justify-between gap-2 p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${getButtonStyles()}`}>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Свое время: 🔒</span>
                    <button
                      disabled={gameState.coins < 5}
                      onClick={() => {
                        if (gameState.coins >= 5) {
                          setGameState(p => ({...p, coins: p.coins - 5, unlockedRest: true}));
                        }
                      }}
                      className={`px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold text-xs disabled:opacity-50 ${getButtonStyles()}`}
                    >
                      Купить (5 🪙)
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => startTimer(gameState.unlockedRest ? customRestSeconds : 25)}
                  className={`w-full text-center ${darkCardBg} hover:bg-primary-50 dark:hover:bg-primary-950 border ${isDark ? 'border-primary-600 hover:border-primary-500' : 'border-primary-200 hover:border-primary-400'} text-primary-600 dark:text-primary-400 font-bold transition-colors p-3 md:p-4 ${getButtonStyles()}`}
                >
                  Запустить таймер {!gameState.unlockedRest && "(25 сек)"}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Auth & Sync Panel */}
        <div className={`p-4 md:p-6 ${getContainerStyles()} ${darkCardBg} border ${isDark ? 'border-neutral-700' : 'border-neutral-200'} flex flex-col md:flex-row items-center justify-between gap-4 mt-6`}>
          {localProfile ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                {localProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold">{localProfile.name}</div>
                <div className={`text-xs ${mutedTextClass}`}>Спортсмен</div>
              </div>
              <button onClick={handleLogoutName} className={`ml-2 sm:ml-4 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${getButtonStyles()}`} aria-label="Сменить имя">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between md:justify-start gap-4 w-full md:w-auto">
              <div>
                <div className="font-bold">Общий рейтинг</div>
                <div className={`text-xs ${mutedTextClass}`}>Укажите имя для рейтинга:</div>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <input
                  type="text"
                  placeholder="Ваше имя..."
                  value={nameInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Zа-яА-ЯёЁ0-9\s]*$/.test(val)) {
                      setNameInput(val);
                    }
                  }}
                  maxLength={15}
                  className={`px-3 py-2 w-full md:w-48 outline-none focus:ring-2 focus:ring-primary-500 ${isDark ? 'bg-neutral-800 text-white border-neutral-600' : 'bg-neutral-50 text-neutral-900 border-neutral-200'} border ${getButtonStyles()}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} disabled={!nameInput.trim()} className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:bg-neutral-400 text-white font-medium flex items-center gap-2 ${getButtonStyles()}`}>
                  Вперед
                </button>
              </div>
            </div>
          )}

          {localProfile && (
            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={handleSyncToLeaderboard}
                disabled={totalCurrentReps - syncedRepsForSession <= 0 || isSyncing}
                className={`w-full md:w-auto px-4 py-2 md:py-3 ${totalCurrentReps - syncedRepsForSession > 0 ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'} font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition-colors ${getButtonStyles()}`}
              >
                {isSyncing ? <div className="w-5 h-5 animate-spin rounded-full border-2 border-t-transparent border-current" /> : <Save className="w-5 h-5" />}
                {totalCurrentReps - syncedRepsForSession > 0 ? `В рейтинг (+${totalCurrentReps - syncedRepsForSession} р.)` : 'Сохранено'}
              </button>
              
              {!gameState.unlockedMultipleSyncs && (
                <div className={`flex flex-col gap-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 ${getButtonStyles()}`}>
                  <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium text-center">Топ-5 раз/день</span>
                  <button
                    disabled={gameState.coins < 35}
                    onClick={() => {
                      if (gameState.coins >= 35) {
                        setGameState(p => ({...p, coins: p.coins - 35, unlockedMultipleSyncs: true}));
                      }
                    }}
                    className="w-full text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 disabled:opacity-50 py-1 rounded"
                  >
                    Купить (35 🪙)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Leaderboard ListView */}
        <Leaderboard 
          isDark={isDark} 
          styleMode={styleMode} 
          getContainerStyles={getContainerStyles} 
          getButtonStyles={getButtonStyles} 
          mutedTextClass={mutedTextClass} 
        />

      </div>
    </div>
  );
}
