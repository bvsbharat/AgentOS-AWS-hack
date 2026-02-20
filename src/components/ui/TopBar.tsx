import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Settings,
  LayoutGrid,
  Plus,
  Moon,
  Sun,
  X,
  ChevronDown
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import type { Agent, AgentStatus, Task } from '@/types';

const statusConfig: Record<AgentStatus, { color: string; label: string }> = {
  available: { color: '#22c55e', label: 'Available' },
  busy: { color: '#eab308', label: 'Busy' },
  deep_focus: { color: '#ef4444', label: 'Deep Focus' },
  sleeping: { color: '#6b7280', label: 'Sleeping' },
};

// SVG blob agent face for app logo — matches ClawbotAgent (yellow)
function AppLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      {/* Body blob */}
      <circle cx="17" cy="18" r="12" fill="#fbbf24" />
      {/* Belly highlight */}
      <ellipse cx="17" cy="20" rx="5" ry="4" fill="#fcd34d" opacity="0.5" />
      {/* Left antenna curve */}
      <path d="M13 8 Q11 3 8 2" stroke="#fbbf24" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="8" cy="2" r="1.5" fill="#fde047" />
      {/* Right antenna curve */}
      <path d="M21 8 Q23 3 26 2" stroke="#fbbf24" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="26" cy="2" r="1.5" fill="#fde047" />
      {/* Left eye */}
      <circle cx="13" cy="16" r="3.2" fill="#0f172a" />
      <circle cx="11.8" cy="14.8" r="1.1" fill="#ffffff" opacity="0.9" />
      <circle cx="14" cy="16.8" r="0.5" fill="#ffffff" opacity="0.5" />
      {/* Right eye */}
      <circle cx="21" cy="16" r="3.2" fill="#0f172a" />
      <circle cx="19.8" cy="14.8" r="1.1" fill="#ffffff" opacity="0.9" />
      <circle cx="22" cy="16.8" r="0.5" fill="#ffffff" opacity="0.5" />
      {/* Left arm stub */}
      <ellipse cx="4.5" cy="18" rx="2.2" ry="3" fill="#f59e0b" />
      {/* Right arm stub */}
      <ellipse cx="29.5" cy="18" rx="2.2" ry="3" fill="#f59e0b" />
      {/* Left foot */}
      <rect x="10" y="28" width="4" height="2.5" rx="1.2" fill="#e6a317" />
      {/* Right foot */}
      <rect x="20" y="28" width="4" height="2.5" rx="1.2" fill="#e6a317" />
    </svg>
  );
}

// SVG blob agent face icon — matches ClawbotAgent style, color-coded
function AgentFaceIcon({ color, size = 20 }: { color: string; size?: number }) {
  // Derive a slightly darker shade for arms/feet
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Body blob */}
      <circle cx="12" cy="13" r="8.5" fill={color} />
      {/* Belly highlight */}
      <ellipse cx="12" cy="14.5" rx="3.5" ry="2.8" fill="#ffffff" opacity="0.12" />
      {/* Left antenna */}
      <path d="M9 5.5 Q7.5 2 5.5 1.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="5.5" cy="1.5" r="1" fill={color} opacity="0.7" />
      {/* Right antenna */}
      <path d="M15 5.5 Q16.5 2 18.5 1.5" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="18.5" cy="1.5" r="1" fill={color} opacity="0.7" />
      {/* Left eye */}
      <circle cx="9" cy="11.5" r="2.3" fill="#0f172a" />
      <circle cx="8" cy="10.5" r="0.8" fill="#ffffff" opacity="0.9" />
      <circle cx="9.8" cy="12.2" r="0.35" fill="#ffffff" opacity="0.5" />
      {/* Right eye */}
      <circle cx="15" cy="11.5" r="2.3" fill="#0f172a" />
      <circle cx="14" cy="10.5" r="0.8" fill="#ffffff" opacity="0.9" />
      <circle cx="15.8" cy="12.2" r="0.35" fill="#ffffff" opacity="0.5" />
      {/* Left arm stub */}
      <ellipse cx="3" cy="13" rx="1.5" ry="2" fill={color} opacity="0.8" />
      {/* Right arm stub */}
      <ellipse cx="21" cy="13" rx="1.5" ry="2" fill={color} opacity="0.8" />
    </svg>
  );
}

function AgentAvatar({ agent, task, onClick, size = 'md' }: { agent: Agent; task?: Task; onClick?: () => void; size?: 'sm' | 'md' }) {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    red: '#ef4444',
    yellow: '#eab308',
    cyan: '#06b6d4',
    pink: '#ec4899',
  };

  const agentColor = colorMap[agent.color] || '#64748b';
  const iconSize = size === 'sm' ? 22 : 28;
  const containerSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const statusDotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative group"
    >
      {/* Progress Ring for Task */}
      {task && (
        <svg className="absolute -top-0.5 -left-0.5 w-[calc(100%+4px)] h-[calc(100%+4px)] rotate-[-90deg]" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={task.progress === 100 ? '#22c55e' : '#06b6d4'}
            strokeWidth="3"
            strokeDasharray={`${task.progress}, 100`}
            className="transition-all duration-500 ease-out"
          />
        </svg>
      )}

      <div
        className={`${containerSize} rounded-full flex items-center justify-center shadow-md transition-all duration-200 group-hover:shadow-lg relative z-10 overflow-hidden`}
        style={{
          backgroundColor: `${agentColor}30`,
          boxShadow: `0 0 8px ${agentColor}30`
        }}
      >
        <AgentFaceIcon color={agentColor} size={iconSize} />
      </div>

      <div
        className={`absolute -bottom-0.5 -right-0.5 ${statusDotSize} rounded-full border-[1.5px] border-slate-900 z-20`}
        style={{ backgroundColor: statusConfig[agent.status].color }}
      />

      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[180px]">
        <div className="bg-slate-900/70 backdrop-blur-2xl text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-white/10">
          <div className="font-semibold mb-0.5 text-sm">{agent.name}</div>
          <div className="text-slate-300 mb-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConfig[agent.status].color }} />
            {statusConfig[agent.status].label}
          </div>
          {task && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Current Task</div>
              <div className="text-cyan-300 font-medium mb-1.5 leading-tight">{task.title}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-400">{task.progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function TopBar({ timeText, dateText }: { timeText: string; dateText: string }) {
  const agents = useAgentStore((state) => state.agents);
  const tasks = useAgentStore((state) => state.tasks);
  const office = useAgentStore((state) => state.office);
  const setShowAgentCreator = useAgentStore((state) => state.setShowAgentCreator);
  const setShowTaskBoard = useAgentStore((state) => state.setShowTaskBoard);
  const setShowConnectionManager = useAgentStore((state) => state.setShowConnectionManager);
  const toggleAllHandsMode = useAgentStore((state) => state.toggleAllHandsMode);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const setTime = useAgentStore((state) => state.setTime);

  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusCounts = agents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<AgentStatus, number>);

  const toggleDayNight = () => {
    setTime(office.isNight ? 14 : 2);
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-3 py-1.5"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        {/* Left: App Logo (separate pill) */}
        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-2xl rounded-2xl px-2.5 py-1 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.25)] shrink-0">
          <AppLogo />
          <span className="text-base font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
            AgentOS
          </span>
        </div>

        {/* Right: Main header bar */}
        <div className="flex-1 flex items-center justify-between bg-slate-900/50 backdrop-blur-2xl rounded-2xl px-3 py-1 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.25)] gap-2">
          {/* Team + Agents */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white/8 rounded-xl px-1.5 py-1 transition-colors hover:bg-white/12">
                <button
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300 hidden sm:inline">Team</span>
                </button>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-1">
                  {agents.slice(0, 8).map((agent) => {
                    const activeTask = tasks.find(t => t.assignedTo === agent.id && t.status === 'in_progress');
                    return (
                      <AgentAvatar
                        key={agent.id}
                        agent={agent}
                        task={activeTask}
                        size="sm"
                        onClick={() => {
                          selectAgent(agent.id);
                          setShowTeamDropdown(false);
                        }}
                      />
                    );
                  })}
                  {agents.length > 8 && (
                    <button
                      onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                      className="w-7 h-7 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-[10px] text-slate-300 font-medium hover:bg-slate-600 transition-colors"
                    >
                      ...
                    </button>
                  )}
                </div>
              </div>

              {/* Team dropdown */}
              <AnimatePresence>
                {showTeamDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-64 bg-slate-900/60 backdrop-blur-2xl rounded-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">Team Members</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {agents.map((agent) => {
                        const activeTask = tasks.find(t => t.assignedTo === agent.id && t.status === 'in_progress');
                        return (
                          <button
                            key={agent.id}
                            onClick={() => {
                              selectAgent(agent.id);
                              setShowTeamDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <AgentAvatar agent={agent} task={activeTask} onClick={() => {}} />
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-medium text-white">{agent.name}</p>
                              {activeTask ? (
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs text-cyan-400 truncate">{activeTask.title}</p>
                                  <div className="w-full bg-slate-700 h-1 rounded-full">
                                    <div
                                      className="bg-cyan-400 h-full rounded-full"
                                      style={{ width: `${activeTask.progress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 capitalize">{agent.role}</p>
                              )}
                            </div>
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: statusConfig[agent.status].color }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/8 hover:bg-white/12 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[11px] text-slate-400">{statusCounts.available || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span className="text-[11px] text-slate-400">{statusCounts.busy || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[11px] text-slate-400">{statusCounts.deep_focus || 0}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              <AnimatePresence>
                {showStatusDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-52 bg-slate-900/60 backdrop-blur-2xl rounded-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden"
                  >
                    <div className="p-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 px-1">Agent Status</p>
                      {(['available', 'busy', 'deep_focus', 'sleeping'] as AgentStatus[]).map((status) => {
                        const count = statusCounts[status] || 0;
                        const agentsWithStatus = agents.filter(a => a.status === status);
                        return (
                          <div key={status} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[status].color }} />
                              <span className="text-xs text-slate-300">{statusConfig[status].label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {agentsWithStatus.slice(0, 3).map(a => (
                                <div key={a.id} className="w-4 h-4">
                                  <AgentFaceIcon color={
                                    ({ blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', orange: '#f97316', red: '#ef4444', yellow: '#eab308', cyan: '#06b6d4', pink: '#ec4899' } as Record<string, string>)[a.color] || '#64748b'
                                  } size={16} />
                                </div>
                              ))}
                              <span className="text-[10px] font-mono text-slate-500 ml-0.5">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Global task board */}
            <button
              onClick={() => setShowTaskBoard(true)}
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/8 hover:bg-white/12 transition-colors"
            >
              <LayoutGrid className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-400">Global task board</span>
            </button>

            {/* Add New Agent button */}
            <Button
              onClick={() => setShowAgentCreator(true)}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white gap-1.5 h-7 px-3 text-xs rounded-lg"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Add New Agent</span>
            </Button>

            {/* Day/Night toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDayNight}
              className="text-slate-400 hover:text-white hover:bg-white/10 w-7 h-7"
            >
              {office.isNight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </Button>

            {/* All Hands Meeting */}
            <Button
              variant="ghost"
              onClick={toggleAllHandsMode}
              title="Assemble all agents in Meeting Room"
              className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 transition-all ${
                office.allHandsMode
                  ? 'text-amber-300 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">All Hands</span>
            </Button>

            {/* Settings (beside bell) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConnectionManager(true)}
              className="text-slate-400 hover:text-white hover:bg-white/10 w-7 h-7"
              title="Settings & Connections"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-white hover:bg-white/10 w-7 h-7"
              onClick={() => {}}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
