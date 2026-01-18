
import React from 'react';
import { UserProfile } from '../types';
import { Users, ShieldCheck, Activity, Calendar, Globe, Search } from 'lucide-react';

interface AdminViewProps {
  users: Record<string, UserProfile>;
}

export const AdminView: React.FC<AdminViewProps> = ({ users }) => {
  // Fix: Explicitly type 'a' and 'b' as UserProfile to avoid 'unknown' type errors during sorting
  const userList = Object.values(users).sort((a: UserProfile, b: UserProfile) => 
    new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime()
  );

  const calculateTotalSync = (schedule: any) => {
    const allSlots = Object.values(schedule).flat() as any[];
    if (allSlots.length === 0) return 0;
    const completed = allSlots.filter(s => s.isCompleted).length;
    return Math.round((completed / allSlots.length) * 100);
  };

  return (
    <div className="animate-fade-in-up space-y-6 sm:space-y-8">
      <div className="relative p-6 sm:p-8 rounded-[2rem] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <ShieldCheck className="w-24 h-24 text-amber-500 animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase tracking-[0.4em] mb-3">
             <Activity className="w-3 h-3" /> Master Command Dashboard
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase font-sans mb-2">
            PILOT <span className="text-amber-500">DIRECTORY</span>
          </h2>
          <p className="text-xs font-mono text-amber-700/60 dark:text-amber-500/60 uppercase tracking-widest max-w-md">
            Monitoring {userList.length} active neural links across the Orbit Network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Fix: Explicitly type 'user' as UserProfile to avoid 'unknown' type errors during mapping */}
        {userList.map((user: UserProfile) => {
          const syncPercent = calculateTotalSync(user.schedule);
          const isOwner = user.username.toLowerCase() === 'arihant';
          
          return (
            <div key={user.username} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 sm:p-6 backdrop-blur-sm ${isOwner ? 'bg-amber-100/50 dark:bg-amber-500/5 border-amber-500/30' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-cyan-500/30'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${isOwner ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-500/40'}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase truncate max-w-[150px] sm:max-w-none">
                        {user.username}
                      </h3>
                      {isOwner && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-bold font-mono uppercase tracking-tighter">
                          System Owner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
                         <Calendar className="w-3 h-3" /> Deployed: {new Date(user.joinedDate).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Lifetime Sync</div>
                      <div className={`text-3xl font-black font-mono tracking-tighter ${syncPercent > 80 ? 'text-green-500 dark:text-green-400' : syncPercent > 40 ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`}>
                        {syncPercent}%
                      </div>
                   </div>
                   <div className="h-10 w-px bg-slate-200 dark:bg-white/5 hidden sm:block"></div>
                   <button className="hidden sm:flex p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                      <Globe className="w-5 h-5" />
                   </button>
                </div>
              </div>

              {/* Energy Cell Progress Bar */}
              <div className="mt-4 w-full flex gap-0.5 h-1.5 opacity-80">
                 {Array.from({ length: 20 }).map((_, i) => {
                     const threshold = (i + 1) * 5;
                     const isActive = syncPercent >= threshold;
                     return (
                         <div 
                            key={i} 
                            className={`flex-1 rounded-sm transition-all duration-500 ${isActive ? (isOwner ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]') : 'bg-slate-200 dark:bg-slate-800'}`}
                         />
                     )
                 })}
              </div>

              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${isOwner ? 'bg-amber-500' : 'bg-cyan-500'}`} />
            </div>
          );
        })}
      </div>

      {userList.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-white dark:bg-white/5">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="font-mono text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Active Pilots Found</p>
         </div>
      )}
    </div>
  );
};
