import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, User, ListOrdered, X, Search, Loader2 } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  displayName: string;
  totalReps: number;
  photoURL?: string;
}

interface LeaderboardProps {
  isDark: boolean;
  styleMode?: string;
  getContainerStyles: () => string;
  getButtonStyles: () => string;
  mutedTextClass: string;
  currentUserId?: string;
}

export function Leaderboard({
  isDark,
  styleMode,
  getContainerStyles,
  getButtonStyles,
  mutedTextClass,
  currentUserId
}: LeaderboardProps) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [fullModalOpen, setFullModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<LeaderboardUser[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [fullLoadError, setFullLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalReps', 'desc'), limit(10));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const topUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaderboardUser[];
        setUsers(topUsers);
      },
      (error) => {
        console.error('Leaderboard Snapshot Error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenFullLeaderboard = async () => {
    setFullModalOpen(true);
    setIsLoadingAll(true);
    setFullLoadError(null);
    setSearchQuery('');

    try {
      const fullQuery = query(collection(db, 'users'), orderBy('totalReps', 'desc'));
      const snapshot = await getDocs(fullQuery);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      setAllUsers(list);
    } catch (error) {
      console.error('Full Leaderboard Load Error:', error);
      setFullLoadError('Не удалось загрузить полный рейтинг. Проверьте подключение.');
    } finally {
      setIsLoadingAll(false);
    }
  };

  const filteredAllUsers = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    return allUsers
      .map((u, idx) => ({ ...u, rank: idx + 1 }))
      .filter(u => !trimmed || (u.displayName || 'Без имени').toLowerCase().includes(trimmed));
  }, [allUsers, searchQuery]);

  const currentUserRank = useMemo(() => {
    if (!currentUserId) return null;
    const idx = allUsers.findIndex(u => u.id === currentUserId);
    return idx >= 0 ? { rank: idx + 1, user: allUsers[idx] } : null;
  }, [allUsers, currentUserId]);

  const renderRankBadge = (rankIndex: number) => {
    const baseStyle =
      rankIndex === 0
        ? 'bg-yellow-100 text-yellow-700 border border-yellow-400'
        : rankIndex === 1
        ? 'bg-slate-200 text-slate-700 border border-slate-400'
        : rankIndex === 2
        ? 'bg-orange-100 text-orange-800 border border-orange-400'
        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300';

    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${baseStyle}`}
      >
        {rankIndex + 1}
      </div>
    );
  };

  return (
    <>
      <div className={`mt-8 overflow-hidden relative ${getContainerStyles()} ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
        <div
          className={`p-4 border-b ${
            isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50'
          } flex flex-wrap justify-between items-center gap-2`}
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Топ спортсменов
          </h2>

          <button
            type="button"
            onClick={handleOpenFullLeaderboard}
            className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white border border-primary-600 shadow-sm transition-all cursor-pointer ${getButtonStyles()}`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Весь рейтинг
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {users.length === 0 ? (
            <div className={`text-center py-6 ${mutedTextClass}`}>
              Пока нет данных. Будь первым!
            </div>
          ) : (
            users.map((user, index) => {
              const isMe = currentUserId && user.id === currentUserId;
              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 border ${getButtonStyles()} ${
                    isMe
                      ? 'border-primary-500 bg-primary-500/10'
                      : isDark
                      ? 'border-neutral-700 bg-neutral-800'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderRankBadge(index)}

                    <div className="flex items-center gap-2 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-8 h-8 rounded-full shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-semibold truncate">{user.displayName || 'Без имени'}</span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded shrink-0">
                          Вы
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-primary-500 text-lg shrink-0 ml-2">
                    {user.totalReps} <span className="text-sm font-normal opacity-70">раз</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Full Leaderboard Modal */}
      {fullModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl border-2 ${getContainerStyles()} ${
              isDark ? 'bg-neutral-900 border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 border-b ${
                isDark ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50'
              } flex items-center justify-between gap-3 shrink-0`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight truncate">
                    Весь рейтинг спортсменов
                  </h3>
                  <p className={`text-xs ${mutedTextClass}`}>
                    {isLoadingAll ? 'Загрузка участников...' : `Всего атлетов в рейтинге: ${allUsers.length}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFullModalOpen(false)}
                className={`p-2 border border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ${getButtonStyles()}`}
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & User Rank Bar */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск атлета по имени..."
                  className={`w-full pl-9 pr-3 py-2 text-sm font-medium rounded-xl border outline-none focus:border-primary-500 ${
                    isDark
                      ? 'bg-neutral-950 border-neutral-700 text-neutral-100'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              {currentUserRank && (
                <div className="p-2.5 px-3 bg-primary-500/10 border border-primary-500/30 flex items-center justify-between text-xs font-bold">
                  <span>
                    Ваше место в общем рейтинге:{' '}
                    <span className="text-primary-500 font-black">#{currentUserRank.rank}</span> из {allUsers.length}
                  </span>
                  <span className="text-primary-500 font-black">{currentUserRank.user.totalReps} раз</span>
                </div>
              )}
            </div>

            {/* Scrollable All Athletes List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {isLoadingAll ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                  <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
                  <span className="text-xs font-semibold">Загружаем полный список атлетов...</span>
                </div>
              ) : fullLoadError ? (
                <div className="py-10 text-center space-y-3">
                  <div className="text-sm text-red-500 font-semibold">{fullLoadError}</div>
                  <button
                    type="button"
                    onClick={handleOpenFullLeaderboard}
                    className={`px-4 py-2 bg-primary-500 text-white text-xs font-bold ${getButtonStyles()}`}
                  >
                    Повторить
                  </button>
                </div>
              ) : filteredAllUsers.length === 0 ? (
                <div className={`text-center py-10 text-sm ${mutedTextClass}`}>
                  {allUsers.length === 0 ? 'В рейтинге пока никого нет.' : 'Атлеты с таким именем не найдены.'}
                </div>
              ) : (
                filteredAllUsers.map(user => {
                  const isMe = currentUserId && user.id === currentUserId;
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 border ${getButtonStyles()} ${
                        isMe
                          ? 'border-primary-500 bg-primary-500/10'
                          : isDark
                          ? 'border-neutral-800 bg-neutral-850'
                          : 'border-neutral-200 bg-neutral-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderRankBadge(user.rank - 1)}

                        <div className="flex items-center gap-2 min-w-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-semibold truncate">{user.displayName || 'Без имени'}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-500 text-white rounded shrink-0">
                              Вы
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-bold text-primary-500 text-base sm:text-lg shrink-0 ml-2">
                        {user.totalReps} <span className="text-xs sm:text-sm font-normal opacity-70">раз</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
