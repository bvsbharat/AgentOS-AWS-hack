import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OfficeScene } from '@/components/three/OfficeScene';
import { TopBar } from '@/components/ui/TopBar';
import { AgentSidebar } from '@/components/ui/AgentSidebar';
import { AgentCreator } from '@/components/ui/AgentCreator';
import { TaskBoard } from '@/components/ui/TaskBoard';
import { StartupGenerator } from '@/components/ui/StartupGenerator';
import { ConnectionManager } from '@/components/ui/ConnectionManager';
import { ActivityLog } from '@/components/ui/ActivityLog';
import { useAgentStore } from '@/store/agentStore';
import './App.css';

function App() {
  const office = useAgentStore((state) => state.office);
  const agents = useAgentStore((state) => state.agents);
  const updateAgent = useAgentStore((state) => state.updateAgent);
  const setShowConnectionManager = useAgentStore((state) => state.setShowConnectionManager);
  
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Agent mood/energy decay
  useEffect(() => {
    const interval = setInterval(() => {
      agents.forEach((agent) => {
        if (agent.status === 'busy' || agent.status === 'deep_focus') {
          const newEnergy = Math.max(0, agent.energy - 0.5);
          const newMood = Math.max(0, agent.mood - 0.2);
          updateAgent(agent.id, { energy: newEnergy, mood: newMood });
        } else if (agent.status === 'available') {
          const newEnergy = Math.min(100, agent.energy + 0.3);
          const newMood = Math.min(100, agent.mood + 0.1);
          updateAgent(agent.id, { energy: newEnergy, mood: newMood });
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [agents, updateAgent]);

  // Auto-assign and execute pending tasks
  useEffect(() => {
    const interval = setInterval(async () => {
      const { tasks, agents, assignTask } = useAgentStore.getState();
      
      // Find pending tasks not yet assigned
      const pendingTasks = tasks.filter(t => t.status === 'pending' && !t.assignedTo);
      
      // Find available agents
      const availableAgents = agents.filter(a => a.status === 'available');
      
      // Auto-assign pending tasks to available agents
      for (let i = 0; i < Math.min(pendingTasks.length, availableAgents.length); i++) {
        const task = pendingTasks[i];
        const agent = availableAgents[i];
        
        // Assign and auto-execute
        await assignTask(task.id, agent.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulate task progress (for already executing tasks)
  useEffect(() => {
    const interval = setInterval(() => {
      const tasks = useAgentStore.getState().tasks;
      tasks.forEach((task) => {
        if (task.status === 'in_progress' && task.progress < 100) {
          const newProgress = Math.min(100, task.progress + Math.random() * 2);
          useAgentStore.getState().updateTask(task.id, { progress: newProgress });
          
          if (newProgress >= 100) {
            useAgentStore.getState().completeTask(task.id);
            // Notify agent
            if (task.assignedTo) {
              useAgentStore.getState().addMessage(task.assignedTo, {
                sender: 'agent',
                content: `Task completed: "${task.title}"! 🎉`,
              });
            }
          }
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <OfficeScene />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Top Bar */}
        <div className="pointer-events-auto">
          <TopBar />
        </div>

        {/* Sidebar (when agent selected) */}
        {office.selectedAgent && (
          <div className="pointer-events-auto">
            <AgentSidebar />
          </div>
        )}

        {/* Modals */}
        <div className="pointer-events-auto">
          <AgentCreator />
          <TaskBoard />
          <StartupGenerator />
          <ConnectionManager 
            isOpen={office.showConnectionManager} 
            onClose={() => setShowConnectionManager(false)} 
          />
          <ActivityLog />
        </div>
      </div>

      {/* Time Display - Current Real Time */}
      <div className="fixed bottom-4 left-4 z-20">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
          <p className="text-lg font-mono text-cyan-400">
            {formatTime(currentTime)}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(currentTime)}
          </p>
        </div>
      </div>

      {/* All Hands Mode Indicator */}
      {office.allHandsMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full px-6 py-2 shadow-lg shadow-cyan-500/30">
            <p className="text-white font-medium flex items-center gap-2">
              <span className="animate-pulse">📢</span>
              All Hands Mode Active
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;
