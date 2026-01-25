import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, X, Trash2, Droplet, Zap } from 'lucide-react';
import { playOrbitSound } from '../utils/audio';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'reminder' | 'water' | 'system';
  timestamp: string;
  read: boolean;
}

interface NotificationBellProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  notifications, 
  onMarkRead, 
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleOpen = () => {
    playOrbitSound('click');
    setIsOpen(!isOpen);
  };

  const handleMarkRead = (id: string) => {
    playOrbitSound('click');
    onMarkRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'water': return <Droplet className="w-4 h-4 text-blue-400" />;
      case 'reminder': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Zap className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative">
      {/* BELL ICON BUTTON */}
      <button 
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
      >
        <motion.div
          animate={unreadCount > 0 ? { 
            rotate: [0, -10, 10, -10, 10, 0],
            transition: { repeat: Infinity, repeatDelay: 3, duration: 0.5 }
          } : {}}
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
        )}
      </button>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for clicking outside */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-4 w-80 sm:w-96 origin-top-right z-50"
            >
              <div className="rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </span>
                  </div>
                  {notifications.length > 0 && (
                    <button 
                      onClick={onClearAll}
                      className="text-[10px] font-mono text-slate-400 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">All caught up</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => handleMarkRead(item.id)}
                          className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 group relative ${!item.read ? 'bg-cyan-500/5' : ''}`}
                        >
                          {!item.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500 shadow-[0_0_10px_cyan]" />
                          )}
                          
                          <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center border ${!item.read ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-slate-800 border-white/5'}`}>
                            {getIcon(item.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-bold truncate pr-2 ${!item.read ? 'text-white' : 'text-slate-400'}`}>
                                {item.title}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap">
                                {item.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-2 bg-black/20 border-t border-white/5 text-center">
                   <div className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em]">Orbit Push System</div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};