
import React from 'react';
import { UserProfile } from '../types';
import { Users, ShieldCheck, Activity, Calendar, Globe, Search, RefreshCw, Trash2, Cloud } from 'lucide-react';

interface AdminViewProps {
  users: Record<string, UserProfile> | UserProfile[]; // Can be object (local) or array (cloud)
  onResetUser?: (username: string) => void;
  onDeleteUser?: (username: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ users, onResetUser, onDeleteUser }) => {
  // Normalize input: Convert to array if it's the local storage object, or use array directly if from cloud
  const userList = Array.isArray(users) 
    ? users 
    : Object.values(users);

  // Sort by last synced (for cloud) or joined date (local)
  const sortedUsers = userList.sort((a, b) => {
     const dateA = new Date((a as any).lastSynced || a.joinedDate).getTime();
     const dateB = new Date((b as any).lastSynced || b.joinedDate).getTime();
     return dateB - dateA; // Newest first
  });

  const calculateTotalSync = (schedule: any) => {
    if (!schedule) return 0;
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
            Monitoring {sortedUsers.length} active neural links across the Global Network.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sortedUsers.map((user: UserProfile) => {
          const syncPercent = calculateTotalSync(user.schedule);
          const isOwner = user.username.toLowerCase() === 'arihant';
          const lastActive = (user as any).lastSynced ? new Date((user as any).lastSynced).toLocaleString() : 'Offline / Local';
          
          return (
            <div key={user.username} className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 sm:p-6 backdrop-blur-sm ${isOwner ? 'bg-amber-100/50 dark:bg-amber-500/5 border-amber-500/30' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-cyan-500/30'}`}>
              <div className="flex flex-col justify-between h-full relative z-10 gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${isOwner ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400 group-hover:border-cyan-500/40'}`}>
                        {user.avatar ? (
                            <img src={user.avatar} alt="u" className="w-full h-full object-cover rounded-xl opacity-80" />
                        ) : (
                            <Users className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase truncate max-w-[150px] sm:max-w-none">
                            {user.username}
                          </h3>
                        </div>
                        {isOwner && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-bold font-mono uppercase tracking-tighter">
                              System Owner
                            </span>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
                            <Cloud className="w-3 h-3" /> {lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-end justify-between border-t border-slate-200 dark:border-white/5 pt-4">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Protocol Progress</div>
                      <div className={`text-3xl font-black font-mono tracking-tighter ${syncPercent > 80 ? 'text-green-500 dark:text-green-400' : syncPercent > 40 ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'}`}>
                        {syncPercent}%
                      </div>
                   </div>
                   
                   <div className="w-full flex gap-0.5 h-1.5 opacity-80">
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

                   <div className="flex items-center justify-end gap-2 pt-2">
                      {isOwner && onResetUser && (
                        <button 
                          onClick={() => onResetUser(user.username)}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-cyan-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                          title="Reset Schedule to Default Template"
                        >
                           <RefreshCw className="w-3 h-3" /> Reset
                        </button>
                      )}
                      
                      {!isOwner && onDeleteUser && (
                          <button 
                            onClick={() => {
                                if (confirm(`TERMINATE USER "${user.username}"? THIS IS IRREVERSIBLE.`)) {
                                    onDeleteUser(user.username);
                                }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                            title="Delete User from Database"
                          >
                             <Trash2 className="w-3 h-3" /> Terminate
                          </button>
                      )}
                   </div>
                </div>
              </div>

              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${isOwner ? 'bg-amber-500' : 'bg-cyan-500'}`} />
            </div>
          );
        })}
      </div>

      {sortedUsers.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl bg-white dark:bg-white/5">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="font-mono text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest">No Active Pilots Found</p>
         </div>
      )}
    </div>
  );
};
