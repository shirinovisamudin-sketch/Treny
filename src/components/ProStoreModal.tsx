import { useState } from 'react';
import { X, Crown, Sparkles, Check, Flame, ShieldCheck, Zap, Coins } from 'lucide-react';
import { playCoinSound } from '../lib/sounds';

interface ProStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  coins: number;
  isPro: boolean;
  unlockedItems: string[];
  onBuyItem: (itemId: string, cost: number) => void;
  onUpgradePro: () => void;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
}

interface ShopItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: 'feature' | 'cosmetic' | 'badge';
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'badge_vip',
    title: '👑 Золотой VIP-значок в ТОПе',
    description: 'Выделите свое имя в общем рейтинге атлетов золотой короной',
    cost: 15,
    icon: '👑',
    category: 'badge'
  },
  {
    id: 'unlimited_sync',
    title: '⚡ Безлимитные синхронизации',
    description: 'Отправляйте свои рекорды в глобальный рейтинг без дневных ограничений',
    cost: 25,
    icon: '⚡',
    category: 'feature'
  },
  {
    id: 'pro_boxing_voice',
    title: '🥊 PRO Аудио-Гонг & Голосовой тренер',
    description: 'Эксклюзивные темпы и расширенная библиотека комбинаций ММА',
    cost: 30,
    icon: '🥊',
    category: 'feature'
  },
  {
    id: 'neon_ultra',
    title: '✨ Ультра-неоновый скин',
    description: 'Эффект глубокого лазерного свечения интерфейса для ночных тренировок',
    cost: 20,
    icon: '✨',
    category: 'cosmetic'
  }
];

export function ProStoreModal({
  isOpen,
  onClose,
  isDark,
  coins,
  isPro,
  unlockedItems,
  onBuyItem,
  onUpgradePro,
  getContainerStyles,
  getButtonStyles
}: ProStoreModalProps) {
  const [activeTab, setActiveTab] = useState<'pro' | 'items'>('pro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-6 shadow-2xl relative ${
          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-2xl font-black">
            🪙
          </div>
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              Магазин & PRO Монетизация
              {isPro && (
                <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
                  PRO АКТИВЕН
                </span>
              )}
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
              <span>Ваш баланс:</span>
              <span className="font-bold text-amber-500 text-sm flex items-center gap-1">
                {coins} 🪙
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pro')}
            className={`py-2 px-3 text-xs md:text-sm font-black rounded-xl border flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pro'
                ? 'bg-amber-500 text-neutral-950 border-amber-600 shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent'
            }`}
          >
            <Crown className="w-4 h-4" />
            PRO Подписка
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-3 text-xs md:text-sm font-black rounded-xl border flex items-center justify-center gap-2 transition-all ${
              activeTab === 'items'
                ? 'bg-amber-500 text-neutral-950 border-amber-600 shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-transparent'
            }`}
          >
            <Coins className="w-4 h-4" />
            Улучшения за 🪙 ({coins})
          </button>
        </div>

        {/* Tab 1: PRO Membership Plan */}
        {activeTab === 'pro' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border-2 border-amber-500/40 text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" /> Лучший выбор для атлетов
              </div>

              <h3 className="text-2xl font-black tracking-tight">Treny Hub PRO Pass</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Полный доступ ко всем возможностям приложения для силовых, единоборств, бега и функционального тренинга.
              </p>

              <div className="space-y-2.5 text-left max-w-sm mx-auto pt-2">
                {[
                  'Все 5 спортивных модулей без ограничений',
                  'Неограниченная синхронизация с рейтингом ТОП',
                  'PRO Голосовой комбо-тренер по боксу',
                  'Все спецэффекты (RGB, Радуга, Подсветка, Слизневый скин)',
                  'Золотой значок атлета 👑 в таблице рекордов'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                {isPro ? (
                  <div className="py-3 px-4 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 font-bold text-sm">
                    ✓ У вас уже активирован PRO статус!
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      playCoinSound();
                      onUpgradePro();
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-neutral-950 font-black text-lg shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Crown className="w-5 h-5" />
                    АКТИВИРОВАТЬ PRO (БЕСПЛАТНЫЙ ТЕСТ)
                  </button>
                )}
                <div className="text-[10px] text-neutral-400 mt-2">
                  В будущем подключение официальной оплаты (Stripe / Google Pay / Telegram Stars)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Coin Shop */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            <div className="text-xs text-neutral-400 mb-2">
              Зарабатывайте монеты 🪙 за ежедневные завершенные тренировки и покупайте постоянные апгрейды!
            </div>

            {SHOP_ITEMS.map(item => {
              const isPurchased = unlockedItems.includes(item.id) || isPro;
              const canAfford = coins >= item.cost;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-xl flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-400">{item.description}</div>
                    </div>
                  </div>

                  <div>
                    {isPurchased ? (
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Куплено
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            playCoinSound();
                            onBuyItem(item.id, item.cost);
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 border-amber-600 shadow'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 border-transparent opacity-60'
                        }`}
                      >
                        {item.cost} 🪙
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
