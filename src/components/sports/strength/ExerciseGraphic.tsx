import React, { useState } from 'react';
import { Camera, Activity, Maximize2 } from 'lucide-react';
import { getExercisePhotoUrl } from '../../../data/exerciseLibrary';

interface ExerciseGraphicProps {
  graphicKey: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  photoUrl?: string;
  exerciseName?: string;
  showToggle?: boolean;
}

export function ExerciseGraphic({
  graphicKey,
  className = '',
  size = 'md',
  photoUrl,
  exerciseName,
  showToggle = true
}: ExerciseGraphicProps) {
  const [viewMode, setViewMode] = useState<'photo' | 'schema'>('photo');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const resolvedPhotoUrl = photoUrl || getExercisePhotoUrl(graphicKey);

  // Small or list sizes
  if (size === 'sm' || size === 'md' || size === 'lg') {
    const dimensions = {
      sm: 'w-10 h-10 rounded-lg',
      md: 'w-16 h-16 rounded-xl',
      lg: 'w-24 h-24 rounded-2xl'
    }[size];

    return (
      <div
        className={`relative ${dimensions} overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 shadow-sm ${className}`}
      >
        {!imgError && resolvedPhotoUrl ? (
          <>
            <img
              src={resolvedPhotoUrl}
              alt={exerciseName || graphicKey}
              referrerPolicy="no-referrer"
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-300 ${
                imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />
            {/* Subtle cinematic gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            {!imgLoaded && (
              <div className="absolute inset-0 bg-neutral-800/80 animate-pulse flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-neutral-500" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-1">
            <ExerciseSvgSchema graphicKey={graphicKey} size={size} />
          </div>
        )}
      </div>
    );
  }

  // Hero size (featured on active exercise card)
  return (
    <div
      className={`relative w-full max-w-sm sm:max-w-md h-52 sm:h-56 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-lg group ${className}`}
    >
      {/* Mode toggle bar (Photo vs Anatomical Schema) */}
      {showToggle && (
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 p-0.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-md">
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
              viewMode === 'photo'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Реалистичное фото"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Фото</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('schema')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
              viewMode === 'schema'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title="Анатомическая схема мышц"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Схема мышц</span>
          </button>
        </div>
      )}

      {/* Realistic Photo View */}
      {viewMode === 'photo' && !imgError && resolvedPhotoUrl ? (
        <div className="w-full h-full relative overflow-hidden bg-neutral-950">
          <img
            src={resolvedPhotoUrl}
            alt={exerciseName || graphicKey}
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105 ${
              imgLoaded ? 'opacity-100 filter-none' : 'opacity-0 scale-98'
            }`}
          />
          {/* Moody Gym Spotlight Vignette & Ambient Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/40 via-transparent to-neutral-950/40 pointer-events-none" />

          {/* Badge at bottom left */}
          <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-neutral-300 border border-white/10 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pro Gym Photography
            </span>
          </div>

          {!imgLoaded && (
            <div className="absolute inset-0 bg-neutral-900 animate-pulse flex flex-col items-center justify-center text-neutral-500 gap-2">
              <Camera className="w-6 h-6 animate-bounce text-primary-500" />
              <span className="text-xs font-medium">Загрузка фотографии...</span>
            </div>
          )}
        </div>
      ) : (
        /* Anatomical Schema View */
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-neutral-900 to-neutral-950 relative">
          <div className="w-full h-full flex items-center justify-center">
            <ExerciseSvgSchema graphicKey={graphicKey} size="hero" />
          </div>
          <div className="absolute bottom-2.5 left-3 z-10">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-neutral-300 border border-white/10 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Целевые мышцы выделены
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Internal SVG Anatomical Schema Component
function ExerciseSvgSchema({ graphicKey, size = 'md' }: { graphicKey: string; size?: string }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    hero: 'w-full max-w-[260px] h-36'
  }[size] || 'w-full h-36';

  const bodyColor = '#cbd5e1';
  const muscleHighlight = '#ef4444'; // fiery red target muscle
  const secondaryMuscle = '#f59e0b'; // amber secondary
  const barColor = '#94a3b8'; // steel bar
  const weightPlateColor = '#3b82f6'; // blue weight plate

  switch (graphicKey) {
    case 'bench_press':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses} stroke="currentColor">
          <rect x="25" y="80" width="110" height="8" rx="4" fill="#64748b" opacity="0.8" />
          <line x1="45" y1="88" x2="45" y2="108" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <line x1="115" y1="88" x2="115" y2="108" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="40" cy="74" rx="8" ry="8" fill={bodyColor} opacity="0.9" />
          <path d="M48 76 L95 76" stroke={muscleHighlight} strokeWidth="12" strokeLinecap="round" />
          <path d="M95 76 L115 88 L125 105" stroke={bodyColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M68 76 L62 56 L64 38" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M82 76 L86 56 L84 38" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="15" y1="36" x2="145" y2="36" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="22" y="16" width="6" height="40" rx="3" fill={weightPlateColor} />
          <rect x="30" y="22" width="5" height="28" rx="2" fill={secondaryMuscle} />
          <rect x="132" y="16" width="6" height="40" rx="3" fill={weightPlateColor} />
          <rect x="125" y="22" width="5" height="28" rx="2" fill={secondaryMuscle} />
          <path d="M74 48 L74 62" stroke={muscleHighlight} strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'incline_press':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="30" y1="95" x2="110" y2="45" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
          <line x1="50" y1="85" x2="50" y2="108" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <line x1="95" y1="55" x2="95" y2="108" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="98" cy="40" rx="7" ry="7" fill={bodyColor} />
          <line x1="92" y1="46" x2="48" y2="78" stroke={muscleHighlight} strokeWidth="10" strokeLinecap="round" />
          <line x1="48" y1="78" x2="42" y2="105" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <rect x="65" y="18" width="16" height="6" rx="2" fill={weightPlateColor} />
          <line x1="73" y1="24" x2="73" y2="52" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="85" y="14" width="16" height="6" rx="2" fill={weightPlateColor} />
          <line x1="93" y1="20" x2="88" y2="48" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'squat':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="20" y1="110" x2="140" y2="110" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <circle cx="80" cy="38" r="8" fill={bodyColor} />
          <line x1="25" y1="46" x2="135" y2="46" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="24" width="7" height="44" rx="3" fill={weightPlateColor} />
          <rect x="123" y="24" width="7" height="44" rx="3" fill={weightPlateColor} />
          <path d="M80 46 L76 72" stroke={bodyColor} strokeWidth="10" strokeLinecap="round" />
          <path d="M76 72 L102 74" stroke={muscleHighlight} strokeWidth="10" strokeLinecap="round" />
          <path d="M102 74 L90 108" stroke={bodyColor} strokeWidth="6" strokeLinecap="round" />
          <path d="M78 48 L65 46" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M82 48 L95 46" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'pullups':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="20" y1="20" x2="140" y2="20" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <line x1="30" y1="10" x2="30" y2="20" stroke="#64748b" strokeWidth="4" />
          <line x1="130" y1="10" x2="130" y2="20" stroke="#64748b" strokeWidth="4" />
          <circle cx="60" cy="20" r="4" fill={bodyColor} />
          <circle cx="100" cy="20" r="4" fill={bodyColor} />
          <path d="M60 20 L68 38 L76 45" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M100 20 L92 38 L84 45" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <circle cx="80" cy="30" r="7" fill={bodyColor} />
          <path d="M72 45 L80 80 L88 45 Z" fill={muscleHighlight} opacity="0.9" />
          <line x1="77" y1="80" x2="74" y2="110" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="83" y1="80" x2="86" y2="110" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'deadlift':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="20" y1="110" x2="140" y2="110" stroke="#64748b" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <line x1="25" y1="92" x2="135" y2="92" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="72" width="8" height="40" rx="3" fill={weightPlateColor} />
          <rect x="122" y="72" width="8" height="40" rx="3" fill={weightPlateColor} />
          <circle cx="62" cy="42" r="7" fill={bodyColor} />
          <path d="M68 46 L95 65" stroke={muscleHighlight} strokeWidth="9" strokeLinecap="round" />
          <path d="M95 65 L88 90 L85 108" stroke={secondaryMuscle} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="74" y1="52" x2="80" y2="92" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'overhead_press':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="25" y1="20" x2="135" y2="20" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="8" width="7" height="24" rx="3" fill={weightPlateColor} />
          <rect x="123" y="8" width="7" height="24" rx="3" fill={weightPlateColor} />
          <line x1="62" y1="20" x2="72" y2="44" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="98" y1="20" x2="88" y2="44" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <circle cx="70" cy="45" r="4" fill={muscleHighlight} />
          <circle cx="90" cy="45" r="4" fill={muscleHighlight} />
          <circle cx="80" cy="40" r="7" fill={bodyColor} />
          <line x1="80" y1="48" x2="80" y2="78" stroke={bodyColor} strokeWidth="8" strokeLinecap="round" />
          <line x1="77" y1="78" x2="72" y2="112" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="83" y1="78" x2="88" y2="112" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'bicep_curl':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <circle cx="75" cy="30" r="7" fill={bodyColor} />
          <line x1="75" y1="38" x2="75" y2="75" stroke={bodyColor} strokeWidth="8" strokeLinecap="round" />
          <line x1="72" y1="75" x2="68" y2="112" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="78" y1="75" x2="82" y2="112" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="75" y1="44" x2="75" y2="60" stroke={bodyColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="82" cy="52" r="5" fill={muscleHighlight} />
          <line x1="75" y1="60" x2="90" y2="46" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="80" y1="46" x2="115" y2="46" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="82" cy="46" r="7" fill={weightPlateColor} />
          <circle cx="112" cy="46" r="7" fill={weightPlateColor} />
        </svg>
      );

    case 'dips':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="45" y1="60" x2="45" y2="110" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <line x1="115" y1="60" x2="115" y2="110" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
          <line x1="35" y1="60" x2="55" y2="60" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <line x1="105" y1="60" x2="125" y2="60" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
          <circle cx="80" cy="35" r="7" fill={bodyColor} />
          <path d="M45 60 L60 48 L75 42" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M115 60 L100 48 L85 42" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M78 44 L80 75" stroke={muscleHighlight} strokeWidth="9" strokeLinecap="round" />
          <path d="M80 75 L92 90 L85 105" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'barbell_row':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <circle cx="58" cy="42" r="7" fill={bodyColor} />
          <path d="M64 48 L94 65" stroke={muscleHighlight} strokeWidth="9" strokeLinecap="round" />
          <path d="M94 65 L98 86 L94 110" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M88 65 L90 86 L86 110" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M70 52 L80 65 L84 76" stroke={bodyColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="76" x2="118" y2="76" stroke={barColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="54" cy="76" r="9" fill={weightPlateColor} />
          <circle cx="114" cy="76" r="9" fill={weightPlateColor} />
        </svg>
      );

    case 'crunches':
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <line x1="25" y1="100" x2="135" y2="100" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          <path d="M92 98 L114 74 L126 98" stroke={bodyColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="65" r="7" fill={bodyColor} />
          <path d="M55 70 Q70 85 92 98" stroke={muscleHighlight} strokeWidth="10" strokeLinecap="round" />
          <path d="M52 64 L42 60" stroke={bodyColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 120" fill="none" className={sizeClasses}>
          <rect x="50" y="55" width="60" height="10" rx="3" fill={barColor} />
          <rect x="36" y="35" width="14" height="50" rx="4" fill={weightPlateColor} />
          <rect x="24" y="42" width="10" height="36" rx="3" fill={secondaryMuscle} />
          <rect x="110" y="35" width="14" height="50" rx="4" fill={weightPlateColor} />
          <rect x="126" y="42" width="10" height="36" rx="3" fill={secondaryMuscle} />
          <circle cx="80" cy="40" r="12" fill={muscleHighlight} opacity="0.8" />
        </svg>
      );
  }
}

