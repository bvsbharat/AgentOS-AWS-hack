import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Search, FileText, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

export function ActivityLog() {
  const [isOpen, setIsOpen] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const activityLogs = useAgentStore((state) => state.activityLogs);

  const getIcon = (toolStep: { toolName: string; action: string }) => {
    const actionLower = toolStep.action.toLowerCase();
    const nameLower = toolStep.toolName.toLowerCase();
    if (actionLower.includes('exa') || actionLower.includes('search') || nameLower.includes('search')) {
      return <Search className="w-3 h-3" />;
    }
    if (actionLower.includes('notion') || nameLower.includes('notion')) {
      return <FileText className="w-3 h-3" />;
    }
    if (actionLower.includes('slack') || nameLower.includes('slack')) {
      return <MessageSquare className="w-3 h-3" />;
    }
    return <Terminal className="w-3 h-3" />;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 bg-slate-900/80 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2 hover:bg-slate-800 transition-colors"
      >
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-slate-300">Activity</span>
        {activityLogs.length > 0 && (
          <span className="bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {activityLogs.length}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-16 right-4 z-40 w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">Agent Activity</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Logs */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No activity yet. Assign a task to see agent actions.
                </p>
              ) : (
                activityLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-cyan-400">{entry.agentName}</span>
                      {entry.toolStep.status === 'success' && <CheckCircle className="w-3 h-3 text-green-400" />}
                      {entry.toolStep.status === 'error' && <XCircle className="w-3 h-3 text-red-400" />}
                      <span className="text-slate-500 text-[10px]">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      {getIcon(entry.toolStep)}
                      <span>{entry.toolStep.action}</span>
                    </div>
                    {entry.toolStep.summary && (
                      <p className="text-slate-500 mt-1 truncate">{entry.toolStep.summary}</p>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
