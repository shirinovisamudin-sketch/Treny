import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Settings,
  Palette,
  User,
  LogOut,
  Save,
  Crown,
  Flame,
  Sparkles,
  Info,
  X,
  Check,
  Dumbbell,
  ArrowLeftRight
} from 'lucide-react';
import { addRepsToLeaderboard } from './lib/firebase';
import { Leaderboard } from './components/Leaderboard';
import { SPORTS_REGISTRY, SportType } from './types/sports';
import { StrengthHub } from './components/sports/StrengthHub';
import { BoxingHub } from './components/sports/BoxingHub';
import { WrestlingHub } from './components/sports/WrestlingHub';
import { RunningHub } from './components/sports/RunningHub';
import { WodHub } from './components/sports/WodHub';
import { ProStoreModal } from './components/ProStoreModal';
import { SportSelectionScreen } from './components/SportSelectionScreen';
import { playCoinSound } from './lib/sounds';

function ColorPickerField({
  hsv,
  setHsv
}: {
  hsv: { h: number; s: number; v: number };
  setHsv: React.Dispatch<React.SetStateAction<{ h: number; s: number; v: number }>>;
}) {
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
  const sl_val = l_val === 0 || l_val === 1 ? 0 : (v_val - l_val) / Math.min(l_val, 1 - l_val);

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div
        ref={svRef}
        onPointerDown={e => {
          setIsDraggingSV(true);
          (e.target as Element).setPointerCapture(e.pointerId);
          updateSV(e.clientX, e.clientY);
        }}
        onPointerMove={e => {
          if (isDraggingSV) {
            updateSV(e.clientX, e.clientY);
          }
        }}
        onPointerUp={e => {
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
        onChange={e => setHsv(prev => ({ ...prev, h: parseInt(e.target.value) }))}
        className="w-full h-4 rounded-full appearance-none outline-none custom-hue-slider shadow-inner border border-neutral-200 dark:border-neutral-700"
        style={{
          background: `linear-gradient(to right, #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #00ff00 37.5%, #00ffff 50%, #0000ff 62.5%, #8000ff 75%, #ff00ff 87.5%, #ff0000 100%)`
        }}
      />
    </div>
  );
}

function getSportDefaultHsv(sport: SportType) {
  switch (sport) {
    case 'boxing':
      return { h: 0, s: 75, v: 95 }; // Боевой красный
    case 'wrestling':
      return { h: 258, s: 65, v: 96 }; // BJJ фиолетовый
    case 'running':
      return { h: 160, s: 80, v: 75 }; // Беговой изумрудный
    case 'wod':
      return { h: 38, s: 95, v: 96 }; // Кроссфит огненно-янтарный
    case 'strength':
    default:
      return { h: 217, s: 90, v: 96 }; // Силовой атлетический синий
  }
}

export default function App() {
  // Active sport in the hub - if not chosen yet, open selection screen
  const [activeSport, setActiveSport] = useState<SportType | null>(() => {
    const saved = localStorage.getItem('treny_active_sport');
    return (saved as SportType) || null;
  });

  const [isSelectingSport, setIsSelectingSport] = useState<boolean>(() => {
    return !localStorage.getItem('treny_active_sport');
  });

  useEffect(() => {
    if (activeSport) {
      localStorage.setItem('treny_active_sport', activeSport);
    }
  }, [activeSport]);

  const handleSelectSport = (sport: SportType) => {
    setActiveSport(sport);
    localStorage.setItem('treny_active_sport', sport);
    setIsSelectingSport(false);
    setHsv(getSportDefaultHsv(sport));
  };

  // Modals
  const [painModalOpen, setPainModalOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Settings State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [styleMode, setStyleMode] = useState<'adult' | 'kids' | 'retro' | 'slime'>('adult');
  const [deviceType, setDeviceType] = useState<'computer' | 'tablet' | 'phone'>('phone');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Colors & FX
  const [hsv, setHsv] = useState({ h: 24, s: 100, v: 100 });
  const [isRgb, setIsRgb] = useState<boolean>(() => localStorage.getItem('treny_is_rgb') === 'true');
  const [isBacklight, setIsBacklight] = useState<boolean>(() => localStorage.getItem('treny_is_backlight') === 'true');
  const [isRainbow, setIsRainbow] = useState<boolean>(() => localStorage.getItem('treny_is_rainbow') === 'true');

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
      setHsv(prev => ({ ...prev, h: (prev.h + 2) % 360 }));
    }, 45);
    return () => clearInterval(interval);
  }, [isRainbow]);

  // Profile & Gamification
  const [localProfile, setLocalProfile] = useState<{ id: string; name: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedRepsForSession, setSyncedRepsForSession] = useState(0);

  const [gameState, setGameState] = useState({
    coins: 10,
    streakDays: 1,
    lastWorkoutDate: '',
    lastCoinDate: '',
    isPro: false,
    unlockedItems: [] as string[],
    syncsToday: 0,
    lastSyncDate: new Date().toLocaleDateString('en-CA'),
    completedReps: 0
  });

  const [workoutSuccessMessage, setWorkoutSuccessMessage] = useState<string | null>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Load profile and gamestate
  useEffect(() => {
    const savedProf = localStorage.getItem('treny_profile');
    if (savedProf) {
      try {
        setLocalProfile(JSON.parse(savedProf));
      } catch (e) {}
    }

    const savedGame = localStorage.getItem('treny_gamestate_v2');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
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
    localStorage.setItem('treny_gamestate_v2', JSON.stringify(gameState));
  }, [gameState]);

  // Theme auto-detection
  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Click outside listener
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

  // Compute CSS HSL
  const v_val = hsv.v / 100;
  const s_val = hsv.s / 100;
  const l_val = v_val * (1 - s_val / 2);
  const sl_val = l_val === 0 || l_val === 1 ? 0 : (v_val - l_val) / Math.min(l_val, 1 - l_val);
  const cssH = hsv.h;
  const cssS = sl_val * 100;
  const cssL = l_val * 100;

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-h', cssH.toString());
    document.documentElement.style.setProperty('--theme-s', `${cssS}%`);
    document.documentElement.style.setProperty('--theme-l', `${cssL}%`);
  }, [cssH, cssS, cssL]);

  const isDark = resolvedTheme === 'dark';

  const getContainerStyles = () => {
    const base = isDark ? 'bg-neutral-850' : 'bg-white';
    let styles = '';
    if (styleMode === 'kids') {
      styles = `${base} rounded-3xl shadow-lg border-[6px] ${isDark ? 'border-primary-900' : 'border-primary-100'}`;
    } else if (styleMode === 'retro') {
      styles = `${base} rounded-none border-4 ${isDark ? 'border-neutral-500 shadow-[6px_6px_0px_0px_rgba(115,115,115,1)]' : 'border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`;
    } else if (styleMode === 'slime') {
      styles = `${base} rounded-[2rem_1rem_2.5rem_1.5rem] border-4 ${isDark ? 'border-green-600 shadow-[0_8px_32px_rgba(34,197,94,0.3)] bg-neutral-900/95' : 'border-green-400 bg-green-50/20 shadow-[0_8px_32px_rgba(74,222,128,0.2)]'}`;
    } else {
      styles = `${base} rounded-2xl shadow-sm border ${isDark ? 'border-neutral-750' : 'border-neutral-200'}`;
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
      styles = 'rounded-2xl border-b-[5px] active:border-b-0 active:translate-y-1';
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

  const fontClass = styleMode === 'retro' ? 'font-mono' : styleMode === 'slime' ? 'font-sans' : 'font-sans';
  const rootClass = `${isDark ? 'bg-neutral-900 text-neutral-100' : 'bg-neutral-50 text-neutral-900'} min-h-screen p-3 md:p-6 transition-colors duration-300 ${fontClass}`;
  const mutedTextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const getDeviceContainerClass = () => {
    if (deviceType === 'phone') return 'max-w-[420px]';
    if (deviceType === 'tablet') return 'max-w-2xl';
    return 'max-w-5xl';
  };

  const isPhone = deviceType === 'phone';
  const currentSportInfo = activeSport ? SPORTS_REGISTRY[activeSport] : SPORTS_REGISTRY['strength'];

  // Daily coin check
  const todayStr = new Date().toLocaleDateString('en-CA');
  const canGetCoinsToday = gameState.lastCoinDate !== todayStr;

  // Handle Finish Workout across any sport
  const handleFinishWorkout = (repsOrScore: number) => {
    playCoinSound();
    const isNewDay = gameState.lastCoinDate !== todayStr;
    const coinsEarned = isNewDay ? 5 : 1;

    setGameState(prev => {
      const nextStreak = isNewDay ? prev.streakDays + 1 : prev.streakDays;
      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        lastCoinDate: todayStr,
        lastWorkoutDate: todayStr,
        streakDays: nextStreak,
        completedReps: prev.completedReps + repsOrScore
      };
    });

    setWorkoutSuccessMessage(`Отлично потренировались! Зачислено +${coinsEarned} 🪙 и ${repsOrScore} очков опыта.`);
    setTimeout(() => setWorkoutSuccessMessage(null), 5000);
  };

  // Auth / Name
  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length > 15) {
      alert('Имя должно быть от 1 до 15 символов.');
      return;
    }
    const badRoots = ['хуй', 'пизд', 'еба', 'ебл', 'бля', 'сука', 'cyka', 'blyat', 'fuck'];
    if (badRoots.some(r => trimmed.toLowerCase().includes(r))) {
      alert('Имя содержит недопустимые слова.');
      return;
    }
    const newProfile = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmed
    };
    localStorage.setItem('treny_profile', JSON.stringify(newProfile));
    setLocalProfile(newProfile);
  };

  const handleLogoutName = () => {
    localStorage.removeItem('treny_profile');
    setLocalProfile(null);
  };

  // Sync to Leaderboard
  const handleSyncToLeaderboard = async () => {
    if (!localProfile) return;
    const repsToSync = gameState.completedReps - syncedRepsForSession;
    if (repsToSync <= 0) return;

    const maxSyncs = gameState.isPro || gameState.unlockedItems.includes('unlimited_sync') ? 99 : 2;
    if (gameState.syncsToday >= maxSyncs) {
      alert(`Лимит бесплатных синхронизаций на сегодня (${maxSyncs}). Разблокируйте PRO в магазине!`);
      return;
    }

    setIsSyncing(true);
    try {
      await addRepsToLeaderboard(localProfile.id, localProfile.name, repsToSync);
      setSyncedRepsForSession(gameState.completedReps);
      setGameState(prev => ({
        ...prev,
        syncsToday: prev.syncsToday + 1
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Shop item purchase
  const handleBuyItem = (itemId: string, cost: number) => {
    if (gameState.coins < cost) return;
    setGameState(prev => ({
      ...prev,
      coins: prev.coins - cost,
      unlockedItems: [...prev.unlockedItems, itemId]
    }));
  };

  const handleUpgradePro = () => {
    setGameState(prev => ({
      ...prev,
      isPro: true
    }));
  };

  // Dedicated Sport Selection Screen (When no sport picked yet or athlete wants to switch)
  if (!activeSport || isSelectingSport) {
    return (
      <SportSelectionScreen
        onSelectSport={handleSelectSport}
        isDark={isDark}
        selectedSport={activeSport}
        onCancel={activeSport ? () => setIsSelectingSport(false) : undefined}
      />
    );
  }

  return (
    <div className={rootClass}>
      <div className={`mx-auto space-y-4 sm:space-y-6 relative transition-all duration-300 ${getDeviceContainerClass()}`}>
        
        {/* Top Header - Tailored specifically to the chosen sport */}
        <header className={`p-4 md:p-5 relative z-40 ${getContainerStyles()} flex flex-col md:flex-row justify-between items-start md:items-center gap-3`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm shrink-0">
              {currentSportInfo.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`${isPhone ? 'text-xl' : 'text-2xl'} font-black tracking-tight ${isRainbow ? 'rainbow-text' : 'text-primary-500'}`}>
                  {styleMode === 'kids' ? `🤸‍♂️ ${currentSportInfo.shortTitle}!` : currentSportInfo.title}
                </h1>
                {gameState.isPro && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 fill-current" /> PRO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <p className={`${mutedTextClass} text-xs hidden sm:block`}>
                  {currentSportInfo.tagline}
                </p>
                <button
                  onClick={() => setIsSelectingSport(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-500 hover:text-primary-600 underline underline-offset-2 transition-colors cursor-pointer"
                  title="Выбрать другой вид спорта"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Сменить дисциплину
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
            {/* Streak */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold text-xs">
              <Flame className="w-4 h-4 fill-current" />
              <span>{gameState.streakDays} дн.</span>
            </div>

            {/* Coins & Store Trigger */}
            <button
              onClick={() => setStoreModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black text-xs transition-all shadow-sm"
              title="Открыть магазин и PRO статус"
            >
              <span className="text-base leading-none">🪙</span>
              <span>{gameState.coins}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Sport Pain & Solution Info Trigger */}
            <button
              onClick={() => setPainModalOpen(true)}
              className={`p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors`}
              title="Особенности и боли вида спорта"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Palette Trigger */}
            <div className="relative" ref={paletteRef}>
              <button
                onClick={() => {
                  setPaletteOpen(!paletteOpen);
                  setSettingsOpen(false);
                }}
                className={`p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors`}
                title="Оформление и подсветка"
              >
                <Palette className="w-4 h-4" />
              </button>

              {paletteOpen && (
                <div className={`absolute right-0 top-full mt-2 w-72 p-4 z-50 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} border rounded-2xl shadow-2xl`}>
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-bold text-sm">Выбор цвета подсветки</h3>
                    <div
                      className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-sm"
                      style={{ backgroundColor: `hsl(${cssH}, ${cssS}%, ${cssL}%)` }}
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
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold border transition-all ${
                            isRgb
                              ? 'bg-neutral-900 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:text-neutral-300'
                          } ${getButtonStyles()}`}
                        >
                          ✨ RGB
                        </button>
                        <button
                          onClick={() => setIsRainbow(!isRainbow)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold border transition-all ${
                            isRainbow
                              ? 'rainbow-bg shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:text-neutral-300'
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
                        className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-bold border transition-all ${
                          isBacklight
                            ? 'bg-neutral-900 bg-opacity-95'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-transparent dark:bg-neutral-750 dark:text-neutral-300'
                        } ${getButtonStyles()}`}
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-white shrink-0"
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

            {/* Settings Trigger */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setPaletteOpen(false);
                }}
                className={`p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors`}
                title="Настройки интерфейса"
              >
                <Settings className="w-4 h-4" />
              </button>

              {settingsOpen && (
                <div className={`absolute right-0 top-full mt-2 w-64 p-4 z-50 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'} border rounded-2xl shadow-2xl`}>
                  <h3 className="font-bold text-sm mb-3 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                    Настройки
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-neutral-400 block mb-1.5">Стиль</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['adult', 'kids', 'retro', 'slime'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStyleMode(s)}
                            className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              styleMode === s
                                ? 'bg-primary-500 text-white border-primary-600'
                                : 'bg-neutral-100 dark:bg-neutral-750 text-neutral-600 dark:text-neutral-300 border-transparent'
                            }`}
                          >
                            {s === 'kids' ? '🎈 Детский' : s === 'adult' ? '👔 Обычный' : s === 'retro' ? '🕹️ Ретро' : '🤢 Слизень'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-neutral-400 block mb-1.5">Тема</span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['dark', 'light', 'system'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`py-1 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                              theme === t
                                ? 'bg-primary-500 text-white border-primary-600'
                                : 'bg-neutral-100 dark:bg-neutral-750 text-neutral-600 dark:text-neutral-300 border-transparent'
                            }`}
                          >
                            {t === 'dark' ? '🌙 Темн.' : t === 'light' ? '☀️ Светл.' : '💻 Авто'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-neutral-400 block mb-1.5">Устройство</span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['phone', 'tablet', 'computer'] as const).map(d => (
                          <button
                            key={d}
                            onClick={() => setDeviceType(d)}
                            className={`py-1 px-1 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                              deviceType === d
                                ? 'bg-primary-500 text-white border-primary-600'
                                : 'bg-neutral-100 dark:bg-neutral-750 text-neutral-600 dark:text-neutral-300 border-transparent'
                            }`}
                          >
                            {d === 'phone' ? '📱 Смарт' : d === 'tablet' ? '📟 Планш' : '🖥️ ПК'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workout Success Notification Banner */}
        {workoutSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-xl flex items-center justify-between animate-fadeIn">
            <span>{workoutSuccessMessage}</span>
            <button onClick={() => setWorkoutSuccessMessage(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Active Sport Workspace - Focused only on the athlete's chosen discipline */}
        <main>
          {activeSport === 'strength' && (
            <StrengthHub
              isDark={isDark}
              getContainerStyles={getContainerStyles}
              getButtonStyles={getButtonStyles}
              mutedTextClass={mutedTextClass}
              onFinishWorkout={handleFinishWorkout}
              canGetCoinsToday={canGetCoinsToday}
            />
          )}

          {activeSport === 'boxing' && (
            <BoxingHub
              isDark={isDark}
              getContainerStyles={getContainerStyles}
              getButtonStyles={getButtonStyles}
              mutedTextClass={mutedTextClass}
              onFinishWorkout={handleFinishWorkout}
              canGetCoinsToday={canGetCoinsToday}
            />
          )}

          {activeSport === 'wrestling' && (
            <WrestlingHub
              isDark={isDark}
              getContainerStyles={getContainerStyles}
              getButtonStyles={getButtonStyles}
              mutedTextClass={mutedTextClass}
              onFinishWorkout={handleFinishWorkout}
              canGetCoinsToday={canGetCoinsToday}
            />
          )}

          {activeSport === 'running' && (
            <RunningHub
              isDark={isDark}
              getContainerStyles={getContainerStyles}
              getButtonStyles={getButtonStyles}
              mutedTextClass={mutedTextClass}
              onFinishWorkout={handleFinishWorkout}
              canGetCoinsToday={canGetCoinsToday}
            />
          )}

          {activeSport === 'wod' && (
            <WodHub
              isDark={isDark}
              getContainerStyles={getContainerStyles}
              getButtonStyles={getButtonStyles}
              mutedTextClass={mutedTextClass}
              onFinishWorkout={handleFinishWorkout}
              canGetCoinsToday={canGetCoinsToday}
            />
          )}
        </main>

        {/* Profile & Leaderboard Sync Section */}
        <div className={`p-5 ${getContainerStyles()} flex flex-col md:flex-row items-center justify-between gap-4 mt-8`}>
          {localProfile ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-lg">
                {localProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  {localProfile.name}
                  {(gameState.isPro || gameState.unlockedItems.includes('badge_vip')) && (
                    <span title="VIP атлет">👑</span>
                  )}
                </div>
                <div className={`text-xs ${mutedTextClass}`}>
                  Рекорд: {gameState.completedReps} очков • {gameState.coins} 🪙
                </div>
              </div>
              <button
                onClick={handleLogoutName}
                className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                title="Сменить имя"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div>
                <div className="font-bold text-sm">Участие в рейтинге атлетов</div>
                <div className={`text-xs ${mutedTextClass}`}>Введите имя для таблицы лидеров:</div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Ваше имя..."
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={15}
                  className={`px-3 py-1.5 rounded-xl border text-sm font-medium outline-none ${
                    isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                  }`}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  onClick={handleSaveName}
                  disabled={!nameInput.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
                >
                  Ок
                </button>
              </div>
            </div>
          )}

          {localProfile && (
            <button
              onClick={handleSyncToLeaderboard}
              disabled={gameState.completedReps - syncedRepsForSession <= 0 || isSyncing}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                gameState.completedReps - syncedRepsForSession > 0
                  ? 'bg-primary-500 hover:bg-primary-600 text-white shadow'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
              } ${getButtonStyles()}`}
            >
              {isSyncing ? (
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {gameState.completedReps - syncedRepsForSession > 0
                ? `В рейтинг (+${gameState.completedReps - syncedRepsForSession})`
                : 'Сохранено'}
            </button>
          )}
        </div>

        {/* Global Leaderboard */}
        <Leaderboard
          isDark={isDark}
          styleMode={styleMode}
          getContainerStyles={getContainerStyles}
          getButtonStyles={getButtonStyles}
          mutedTextClass={mutedTextClass}
        />

        {/* Sports Pain & Solutions Detailed Modal */}
        {painModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div
              className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-2 p-6 shadow-2xl relative ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              <button
                onClick={() => setPainModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-black mb-1 flex items-center gap-2">
                💡 Особенности и боли видов спорта
              </h2>
              <p className={`text-xs ${mutedTextClass} mb-6`}>
                Как Treny решает реальные проблемы атлетов в каждом виде спорта
              </p>

              <div className="space-y-6">
                {(Object.keys(SPORTS_REGISTRY) as SportType[]).map(key => {
                  const s = SPORTS_REGISTRY[key];
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-2xl border ${
                        activeSport === key
                          ? 'border-primary-500 bg-primary-500/5'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-850'
                          : 'border-neutral-200 bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2 font-black text-base">
                        <span>{s.emoji}</span>
                        <span>{s.title}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                          <div className="font-bold text-red-400 mb-1.5 uppercase text-[10px]">
                            ❌ Боли атлетов:
                          </div>
                          <ul className="space-y-1 text-neutral-300">
                            {s.painPoints.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="font-bold text-emerald-400 mb-1.5 uppercase text-[10px]">
                            ✅ Как решает Treny:
                          </div>
                          <ul className="space-y-1 text-neutral-300">
                            {s.solutions.map((sol, i) => (
                              <li key={i}>✓ {sol}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PRO Store & Monetization Modal */}
        <ProStoreModal
          isOpen={storeModalOpen}
          onClose={() => setStoreModalOpen(false)}
          isDark={isDark}
          coins={gameState.coins}
          isPro={gameState.isPro}
          unlockedItems={gameState.unlockedItems}
          onBuyItem={handleBuyItem}
          onUpgradePro={handleUpgradePro}
          getContainerStyles={getContainerStyles}
          getButtonStyles={getButtonStyles}
        />

      </div>
    </div>
  );
}
