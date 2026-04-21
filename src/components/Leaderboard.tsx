import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, User } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  displayName: string;
  totalReps: number;
  photoURL?: string;
}

export function Leaderboard({ isDark, styleMode, getContainerStyles, getButtonStyles, mutedTextClass }: any) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('totalReps', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const topUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LeaderboardUser[];
        setUsers(topUsers);
      },
      (error) => {
        console.error("Leaderboard Snapshot Error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className={`mt-8 overflow-hidden relative ${getContainerStyles()} ${isDark ? 'bg-neutral-800' : 'bg-white'}`}>
      <div className={`p-4 border-b ${isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50'} flex justify-between items-center`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Топ спортсменов
        </h2>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        {users.length === 0 ? (
          <div className={`text-center py-6 ${mutedTextClass}`}>
            Пока нет данных. Будь первым!
          </div>
        ) : (
          users.map((user, index) => (
            <div 
              key={user.id} 
              className={`flex items-center justify-between p-3 border ${getButtonStyles()} ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-400' :
                  index === 1 ? 'bg-slate-200 text-slate-700 border border-slate-400' :
                  index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-400' :
                  `bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400`
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-semibold">{user.displayName || 'Без имени'}</span>
                </div>
              </div>
              
              <div className="font-bold text-primary-500 text-lg">
                {user.totalReps} <span className="text-sm font-normal opacity-70">раз</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
