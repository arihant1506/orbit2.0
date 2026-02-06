
import React, { useState, useRef, useMemo } from 'react';
import { NoteItem, Priority } from '../types';
import { Plus, X, Edit3, Trash2, Check, ArrowRight, Zap, FileText, Lock, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo, LayoutGroup } from 'framer-motion';
import { playOrbitSound } from '../utils/audio';

interface NotesViewProps {
  notes: NoteItem[];
  onUpdateNotes: (notes: NoteItem[]) => void;
}

// --- SUB-COMPONENT: SLIDE TO ARCHIVE BUTTON ---
const SlideToArchive = ({ onComplete }: { onComplete: () => void }) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const maxDrag = 150;
    const [dragged, setDragged] = useState(false);
  
    const backgroundOpacity = useTransform(x, [0, maxDrag], [0, 1]);
    const textOpacity = useTransform(x, [0, maxDrag / 2], [1, 0]);
  
    const handleDragEnd = async (_: any, info: PanInfo) => {
      const offset = info.offset.x;
      if (offset > maxDrag * 0.6) {
        setDragged(true);
        playOrbitSound('power_up');
        await controls.start({ x: maxDrag });
        onComplete();
      } else {
        playOrbitSound('click');
        controls.start({ x: 0 });
      }
    };
  
    return (
      <div className="relative w-full h-10 mt-3 bg-black/40 rounded-xl border border-white/5 overflow-hidden group/slider">
        <motion.div style={{ opacity: backgroundOpacity }} className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-500/40" />
        <motion.div style={{ opacity: textOpacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] group-hover/slider:text-emerald-400 transition-colors">
             Slide to Encrypt
          </span>
          <ChevronRight className="absolute right-2 w-3 h-3 text-slate-600" />
        </motion.div>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x }}
          className="absolute top-1 left-1 bottom-1 w-8 bg-slate-200 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-20 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:bg-emerald-400 hover:text-black transition-colors"
        >
          {dragged ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </motion.div>
      </div>
    );
};

export const NotesView: React.FC<NotesViewProps> = ({ notes, onUpdateNotes }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Split notes
  const activeNotes = useMemo(() => notes.filter(n => !n.isCompleted).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notes]);
  const archivedNotes = useMemo(() => notes.filter(n => n.isCompleted).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [notes]);
  
  const displayNotes = filter === 'archived' ? archivedNotes : activeNotes;

  const openModal = (note?: NoteItem) => {
    playOrbitSound('click');
    if (note) {
      setEditingId(note.id);
      setTitle(note.title);
      setContent(note.content);
      setPriority(note.priority);
    } else {
      setEditingId(null); setTitle(''); setContent(''); setPriority('medium');
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    playOrbitSound('success_chord');
    
    const newNote: NoteItem = {
      id: editingId || `note-${Date.now()}`,
      title,
      content,
      priority,
      isCompleted: editingId ? notes.find(n => n.id === editingId)?.isCompleted || false : false,
      createdAt: editingId ? notes.find(n => n.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    if (editingId) {
      onUpdateNotes(notes.map(n => n.id === editingId ? newNote : n));
    } else {
      onUpdateNotes([...notes, newNote]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    playOrbitSound('delete');
    onUpdateNotes(notes.filter(n => n.id !== id));
  };

  const handleArchive = (id: string) => {
      // Find note and toggle
      const updated = notes.map(n => n.id === id ? { ...n, isCompleted: true } : n);
      onUpdateNotes(updated);
  };

  const handleRestore = (id: string) => {
      playOrbitSound('click');
      const updated = notes.map(n => n.id === id ? { ...n, isCompleted: false } : n);
      onUpdateNotes(updated);
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
          case 'medium': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
          case 'low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      }
  };

  return (
    <div className="animate-fade-in-up space-y-8 pb-32">
      
      {/* HEADER CARD */}
      <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10 overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-1000">
           <FileText className="w-32 h-32 text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
           <div>
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-[10px] uppercase tracking-[0.4em] mb-2">
                 <Zap className="w-3 h-3" /> Neural Scratchpad
              </div>
              <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white uppercase font-sans pr-2">
                 Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Shards</span>
              </h2>
           </div>
           
           <button 
             onClick={() => openModal()}
             className="px-6 py-3 rounded-xl bg-white text-black font-black italic uppercase tracking-wider flex items-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg active:scale-95"
           >
             <Plus className="w-4 h-4" /> New Shard
           </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex justify-center">
         <div className="bg-black/30 p-1 rounded-full border border-white/10 flex gap-1">
             <button onClick={() => { setFilter('active'); playOrbitSound('click'); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'active' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Active</button>
             <button onClick={() => { setFilter('archived'); playOrbitSound('click'); }} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${filter === 'archived' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Archived</button>
         </div>
      </div>

      {/* NOTES GRID */}
      <LayoutGroup>
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <AnimatePresence mode='popLayout'>
        {displayNotes.length === 0 ? (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
             className="col-span-1 md:col-span-2 py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500"
           >
              <LayoutGrid className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-mono text-xs uppercase tracking-widest">No Data Shards Found</p>
           </motion.div>
        ) : (
           displayNotes.map(note => (
              <motion.div
                 layout
                 key={note.id}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 className={`group relative p-6 rounded-[2rem] border backdrop-blur-md flex flex-col justify-between min-h-[220px] transition-all duration-300 ${note.isCompleted ? 'bg-slate-900/50 border-white/5 opacity-60 grayscale hover:grayscale-0' : 'bg-[#0a0a0a]/80 border-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]'}`}
              >
                  {/* Priority Indicator */}
                  <div className={`absolute top-6 right-6 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${getPriorityColor(note.priority)}`}>
                     {note.priority} Priority
                  </div>

                  <div>
                      <h3 className={`text-xl sm:text-2xl font-black italic uppercase tracking-tight leading-none mb-3 ${note.isCompleted ? 'line-through text-slate-600' : 'text-white'}`}>
                          {note.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-mono text-slate-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                          {note.content}
                      </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                             {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                              {!note.isCompleted && (
                                <button onClick={() => openModal(note)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {note.isCompleted ? (
                                  <>
                                      <button onClick={() => handleRestore(note.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-colors">
                                          Restore
                                      </button>
                                      <button onClick={() => handleDelete(note.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </>
                              ) : (
                                <button onClick={() => handleDelete(note.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </div>
                      </div>
                      
                      {!note.isCompleted && (
                         <SlideToArchive onComplete={() => handleArchive(note.id)} />
                      )}
                      
                      {note.isCompleted && (
                          <div className="w-full py-2 bg-black/20 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-[10px] font-mono uppercase tracking-widest border border-white/5">
                              <Lock className="w-3 h-3" /> Encrypted & Archived
                          </div>
                      )}
                  </div>
              </motion.div>
           ))
        )}
        </AnimatePresence>
      </motion.div>
      </LayoutGroup>

      {/* EDITOR MODAL */}
      <AnimatePresence>
      {modalOpen && (
         <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
            onClick={() => setModalOpen(false)}
         >
             <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-[#050507] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
             >
                {/* Modal Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                   <div>
                      <div className="flex items-center gap-2 text-indigo-400 font-mono text-[9px] uppercase tracking-widest mb-1">
                          <Edit3 className="w-3 h-3" /> {editingId ? 'Modify Shard' : 'New Entry'}
                      </div>
                      <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Content Editor</h3>
                   </div>
                   <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="space-y-5 relative z-10">
                   <div className="space-y-2">
                       <label className="text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Title Identifier</label>
                       <input 
                          value={title} onChange={e => setTitle(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-black italic text-xl outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                          placeholder="SHARD TITLE..."
                          autoFocus
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Data Packet</label>
                       <textarea 
                          value={content} onChange={e => setContent(e.target.value)}
                          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-300 font-mono text-sm outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700 resize-none"
                          placeholder="Input raw data..."
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[9px] font-bold font-mono text-slate-500 uppercase ml-2">Priority Level</label>
                       <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as Priority[]).map(p => (
                              <button
                                 key={p}
                                 onClick={() => setPriority(p)}
                                 className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${priority === p ? getPriorityColor(p) + ' scale-105' : 'bg-black/20 border-white/5 text-slate-600 hover:bg-white/5'}`}
                              >
                                  {p}
                              </button>
                          ))}
                       </div>
                   </div>

                   <button 
                      onClick={handleSave}
                      className="w-full py-4 bg-white hover:bg-indigo-400 text-black font-black italic uppercase rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                   >
                      {editingId ? 'Update Data' : 'Upload Shard'} <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
             </motion.div>
         </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
};
