import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Github, Twitter, Search, Code, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';

interface ActivityLog {
  id: string;
  timestamp: Date;
  agentName: string;
  action: string;
  tool: string;
  status: 'running' | 'success' | 'error';
  details: string;
}

export function ActivityLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to task changes to show activity
  useEffect(() => {
    const unsubscribe = useAgentStore.subscribe((state) => {
      const tasks = state.tasks;
      const agents = state.agents;
      
      // Check for recently completed or in-progress tasks
      tasks.forEach((task) => {
        if (task.status === 'in_progress' || (task.completedAt && Date.now() - task.completedAt < 5000)) {
          const agent = agents.find(a => a.id === task.assignedTo);
          if (agent) {
            const existingLog = logs.find(l => l.details.includes(task.id));
            if (!existingLog && task.status === 'in_progress') {
              addLog(agent.name, 'Executing task', getToolForTask(task.title), 'running', task.title);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const addLog = (agentName: string, action: string, tool: string, status: ActivityLog['status'], details: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      agentName,
      action,
      tool,
      status,
      details
    };
    setLogs(prev => [...prev.slice(-19), newLog]); // Keep last 20 logs
  };

  const getToolForTask = (taskTitle: string): string => {
    const lower = taskTitle.toLowerCase();
    if (lower.includes('github') || lower.includes('repo') || lower.includes('code') || lower.includes('push')) return 'github';
    if (lower.includes('tweet') || lower.includes('twitter') || lower.includes('social')) return 'twitter';
    if (lower.includes('search') || lower.includes('research') || lower.includes('market')) return 'search';
    if (lower.includes('design') || lower.includes('image') || lower.includes('visual')) return 'gemini';
    return 'bedrock';
  };

  const getIcon = (tool: string) => {
    switch (tool) {
      case 'github': return <Github className="w-3 h-3" />;
      case 'twitter': return <Twitter className="w-3 h-3" />;
      case 'search': return <Search className="w-3 h-3" />;
      case 'gemini': return <Code className="w-3 h-3" />;
      default: return <Terminal className="w-3 h-3" />;
    }
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
        {logs.length > 0 && (
          <span className="bg-cyan-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {logs.length}
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
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No activity yet. Assign a task to see agent actions.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-cyan-400">{log.agentName}</span>
                      {log.status === 'running' && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />}
                      {log.status === 'success' && <CheckCircle className="w-3 h-3 text-green-400" />}
                      {log.status === 'error' && <XCircle className="w-3 h-3 text-red-400" />}
                      <span className="text-slate-500 text-[10px]">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      {getIcon(log.tool)}
                      <span>{log.action}</span>
                    </div>
                    <p className="text-slate-500 mt-1 truncate">{log.details}</p>
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
