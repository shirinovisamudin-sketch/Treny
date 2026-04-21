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

  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [styleMode, setStyleMode] = useState<'adult' | 'kids' | 'retro'>('adult');
  const [deviceType, setDeviceType] = useState<'computer' | 'tablet' | 'phone'>('computer');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const [hsv, setHsv] = useState({ h: 24, s: 100, v: 100 }); // Default base color (orangeish)

  const settingsRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const [localProfile, setLocalProfile] = useState<{id: string, name: string} | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [syncedRepsForSession, setSyncedRepsForSession] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    const newProfile = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
      name: nameInput.trim()
    };
    localStorage.setItem('treny_profile', JSON.stringify(newProfile));
    setLocalProfile(newProfile);
  };

  const handleLogoutName = () => {
    localStorage.removeItem('treny_profile');
    setLocalProfile(null);
  };

  const rows = ['Верх ↑', 'Вниз ↓', 'Верх ↑', 'Вниз ↓'];

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const toggleCell = (rowIdx: number, colIdx: number) => {
    const newGrid = [...gridState];
    newGrid[rowIdx] = [...newGrid[rowIdx]];
    newGrid[rowIdx][colIdx] = !newGrid[rowIdx][colIdx];
    setGridState(newGrid);
  };

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setTotalTimerTime(seconds);
    setTimerActive(true);
  };

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setTimerActive(!timerActive);
    }
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeLeft(0);
    setTotalTimerTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const checkedCount = gridState.flat().filter(Boolean).length;
  const currentReps = checkedCount * 12;
  const isFinished = currentReps >= 192;

  const timerProgress = totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0;

  const handleSyncToLeaderboard = async () => {
    if (!localProfile) return;
    
    const repsToSync = currentReps - syncedRepsForSession;
    if (repsToSync <= 0) return;
    
    setIsSyncing(true);
    try {
      await addRepsToLeaderboard(localProfile.id, localProfile.name, repsToSync);
      setSyncedRepsForSession(currentReps);
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
    if (styleMode === 'kids') return `${base} rounded-3xl shadow-lg border-[6px] ${isDark ? 'border-primary-900' : 'border-primary-100'}`;
    if (styleMode === 'retro') return `${base} rounded-none border-4 ${isDark ? 'border-neutral-500 shadow-[8px_8px_0px_0px_rgba(115,115,115,1)]' : 'border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`;
    return `${base} rounded-2xl shadow-sm border ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`;
  };

  const getButtonStyles = () => {
    if (styleMode === 'kids') return 'rounded-2xl border-b-[6px] active:border-b-0 active:translate-y-1.5';
    if (styleMode === 'retro') return 'rounded-none border-2';
    return 'rounded-xl';
  };

  const fontClass = styleMode === 'retro' ? 'font-mono' : styleMode === 'kids' ? 'font-sans text-[1.05rem] tracking-wide' : 'font-sans';
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
            <h1 className={`${isPhone ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight text-primary-500 ${styleMode === 'retro' ? 'uppercase' : ''}`}>
              {styleMode === 'kids' ? '🤸‍♂️ Треня!' : 'Тренировка'}
            </h1>
            <p className={`${mutedTextClass} mt-1 ${isPhone ? 'text-sm' : ''}`}>Отслеживание подходов и отдыха</p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex flex-1 items-center gap-2 md:gap-3 ${isDark ? 'bg-primary-950 border-primary-800' : 'bg-primary-50 border-primary-100'} px-3 md:px-4 py-2 border ${getButtonStyles()} justify-center md:justify-start`}>
              <Trophy className={`${isPhone ? 'w-4 h-4' : 'w-5 h-5'} ${isFinished ? 'text-green-500' : 'text-primary-400'}`} />
              <div className={`${isPhone ? 'text-xs' : 'text-sm'} font-medium whitespace-nowrap`}>
                <span className={mutedTextClass}>Сделано: </span>
                <span className={`text-base md:text-lg font-bold ${isFinished ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-primary-400' : 'text-primary-600')}`}>
                  {currentReps}
                </span>
                <span className={mutedTextClass}> / 192 р.</span>
              </div>
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
                          {(['kids', 'adult', 'retro'] as const).map(s => {
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
                                {s === 'kids' ? '🎈 Детский' : s === 'adult' ? '👔 Взрослый' : '🕹️ Ретро'}
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
            </div>

            {/* Rules */}
            <div className={`p-4 md:p-6 relative overflow-hidden ${getContainerStyles()}`}>
              {styleMode !== 'retro' && (
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-500 opacity-80"></div>
              )}
              <h2 className={`${isPhone ? 'text-base' : 'text-xl'} font-bold text-primary-500 uppercase flex items-center gap-2 mb-3 md:mb-4 ${styleMode !== 'retro' ? 'ml-2' : ''}`}>
                Правила
              </h2>
              <ul className={`space-y-3 md:space-y-4 font-medium ${isPhone ? 'text-sm' : 'text-lg'} ${styleMode !== 'retro' ? 'ml-2' : ''}`}>
                <li className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <span className="text-primary-500 shrink-0">1)</span>
                  <span>1 подход = <span className={`ring-2 ${isDark ? 'ring-primary-900 bg-primary-950' : 'ring-primary-200 bg-primary-50'} px-2 py-0.5 md:py-1 mx-1 ${getButtonStyles()}`}>12 раз</span></span>
                </li>
                <li className="flex items-center gap-2 md:gap-3 flex-wrap">
                  <span className="text-primary-500 shrink-0">2)</span>
                  <span>Всего ровно <span className={`ring-2 ${isDark ? 'ring-red-900 bg-red-950 text-red-400' : 'ring-red-200 bg-red-50 text-red-600'} font-bold px-2 py-0.5 md:py-1 mx-1 underline decoration-red-400 decoration-2 underline-offset-4 ${getButtonStyles()}`}>192 р.</span></span>
                </li>
              </ul>
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
                  disabled={timeLeft === 0}
                  className={`flex-1 ${isDark ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-300' : 'bg-neutral-900 text-white hover:bg-neutral-800'} py-2 md:py-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getButtonStyles()}`}
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

              <div className="space-y-2 md:space-y-3 w-full">
                <button
                  onClick={() => startTimer(25)}
                  className={`w-full text-left ${darkCardBg} hover:bg-primary-50 dark:hover:bg-primary-950 border ${isDark ? 'border-neutral-600 hover:border-primary-600' : 'border-neutral-200 hover:border-primary-200'} transition-colors p-3 md:p-4 flex flex-col ${getButtonStyles()}`}
                >
                  <span className={`${isPhone ? 'text-xs' : 'text-sm'} ${mutedTextClass} font-medium`}>Стандартный отдых</span>
                  <span className={`${isPhone ? 'text-base' : 'text-lg'} font-bold`}>25 сек</span>
                </button>
                <button
                  onClick={() => startTimer(35)}
                  className={`w-full text-left ${darkCardBg} hover:bg-primary-50 dark:hover:bg-primary-950 border ${isDark ? 'border-neutral-600 hover:border-primary-600' : 'border-neutral-200 hover:border-primary-200'} transition-colors p-3 md:p-4 flex flex-col ${getButtonStyles()}`}
                >
                  <span className={`${isPhone ? 'text-xs' : 'text-sm'} ${mutedTextClass} font-medium whitespace-normal`}>После 4 подходов</span>
                  <span className={`${isPhone ? 'text-base' : 'text-lg'} font-bold`}>35 сек</span>
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
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={20}
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
            <button 
              onClick={handleSyncToLeaderboard}
              disabled={currentReps - syncedRepsForSession <= 0 || isSyncing}
              className={`w-full md:w-auto px-4 py-2 md:py-3 ${currentReps - syncedRepsForSession > 0 ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'} font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition-colors ${getButtonStyles()}`}
            >
              {isSyncing ? <div className="w-5 h-5 animate-spin rounded-full border-2 border-t-transparent border-current" /> : <Save className="w-5 h-5" />}
              {currentReps - syncedRepsForSession > 0 ? `В рейтинг (+${currentReps - syncedRepsForSession} р.)` : 'Сохранено'}
            </button>
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
