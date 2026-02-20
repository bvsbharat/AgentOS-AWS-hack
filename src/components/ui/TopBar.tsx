import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Settings, 
  Bell, 
  LayoutGrid, 
  Plus,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import type { Agent, AgentStatus } from '@/types';

const statusConfig: Record<AgentStatus, { color: string; label: string }> = {
  available: { color: '#22c55e', label: 'Available' },
  busy: { color: '#eab308', label: 'Busy' },
  deep_focus: { color: '#ef4444', label: 'Deep Focus' },
  sleeping: { color: '#6b7280', label: 'Sleeping' },
};

function AgentAvatar({ agent, onClick }: { agent: Agent; onClick: () => void }) {
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

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative group"
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-200 group-hover:shadow-xl"
        style={{ 
          backgroundColor: colorMap[agent.color],
          boxShadow: `0 0 15px ${colorMap[agent.color]}40`
        }}
      >
        {agent.name.charAt(0)}
      </div>
      <div 
        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
        style={{ backgroundColor: statusConfig[agent.status].color }}
      />
      
      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="bg-slate-800/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {agent.name} - {statusConfig[agent.status].label}
        </div>
      </div>
    </motion.button>
  );
}

export function TopBar() {
  const agents = useAgentStore((state) => state.agents);
  const office = useAgentStore((state) => state.office);
  const setShowAgentCreator = useAgentStore((state) => state.setShowAgentCreator);
  const setShowTaskBoard = useAgentStore((state) => state.setShowTaskBoard);
  const setShowConnectionManager = useAgentStore((state) => state.setShowConnectionManager);
  const toggleAllHandsMode = useAgentStore((state) => state.toggleAllHandsMode);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const setTime = useAgentStore((state) => state.setTime);

  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

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
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AgentOS
            </span>
          </div>

          {/* Team Roster */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Team</span>
                <div className="flex -space-x-2">
                  {agents.slice(0, 3).map((agent) => (
                    <div
                      key={agent.id}
                      className="w-6 h-6 rounded-full border-2 border-slate-800"
                      style={{ backgroundColor: agent.color }}
                    />
                  ))}
                  {agents.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-xs text-white">
                      +{agents.length - 3}
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showTeamDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 left-0 w-64 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">Team Members</p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-green-400">{statusCounts.available || 0} Available</span>
                        <span className="text-yellow-400">{statusCounts.busy || 0} Busy</span>
                        <span className="text-red-400">{statusCounts.deep_focus || 0} Focus</span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {agents.map((agent) => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            selectAgent(agent.id);
                            setShowTeamDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <AgentAvatar agent={agent} onClick={() => {}} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{agent.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{agent.role}</p>
                          </div>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusConfig[agent.status].color }}
                          />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate-400">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-slate-400">Busy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">Deep Focus</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDayNight}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              {office.isNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTaskBoard(true)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAllHandsMode}
              className={`${office.allHandsMode ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <Bell className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConnectionManager(true)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
              title="Settings & Connections"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowAgentCreator(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Hire Agent</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
