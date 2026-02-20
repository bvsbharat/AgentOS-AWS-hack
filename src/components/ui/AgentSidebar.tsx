import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Mic, 
  FileText,
  Play,
  Download,
  Radio,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AgentColor } from '@/types';

const colorMap: Record<AgentColor, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
  yellow: '#eab308',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

const personalityGreetings: Record<string, string[]> = {
  chill: ["Hey, what's up?", "Yo! Ready to help.", "Sup? I'm here if you need me."],
  focused: ["Ready to work.", "What do you need?", "I'm listening."],
  chatty: ["Hey there! How's it going?", "Oh hi! I've been waiting for you!", "Hello! What's on your mind today?"],
  sarcastic: ["Oh great, more work.", "*sigh* What now?", "I'm here, unfortunately."],
  enthusiastic: ["WOOHOO! Let's do this!", "I'm SO excited to help!", "YESSS! What are we building?!"],
};

function TaskCard({ task }: { task: { id: string; title: string; description: string; status: string; progress: number } }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-slate-600',
    in_progress: 'bg-blue-500',
    review: 'bg-yellow-500',
    completed: 'bg-green-500',
  };

  const StatusIcon = {
    pending: Clock,
    in_progress: AlertCircle,
    review: FileText,
    completed: CheckCircle2,
  }[task.status] || Clock;

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{task.title}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
        </div>
        <div className={`p-1.5 rounded-lg ${statusColors[task.status] || 'bg-slate-600'}`}>
          <StatusIcon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      {task.status === 'in_progress' && (
        <div className="mt-3">
          <Progress value={task.progress} className="h-1.5" />
          <p className="text-xs text-slate-400 mt-1">{task.progress}% complete</p>
        </div>
      )}
    </div>
  );
}

export function AgentSidebar() {
  const agents = useAgentStore((state) => state.agents);
  const tasks = useAgentStore((state) => state.tasks);
  const office = useAgentStore((state) => state.office);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const addMessage = useAgentStore((state) => state.addMessage);
  const addTask = useAgentStore((state) => state.addTask);
  const broadcastToAll = useAgentStore((state) => state.broadcastToAll);

  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((a) => a.id === office.selectedAgent);
  const agentTasks = tasks.filter((t) => t.assignedTo === office.selectedAgent);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedAgent?.conversations]);

  // Play greeting when agent is selected
  useEffect(() => {
    if (selectedAgent && selectedAgent.conversations.length === 0) {
      const greetings = personalityGreetings[selectedAgent.personality];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      addMessage(selectedAgent.id, { sender: 'agent', content: greeting });
    }
  }, [selectedAgent?.id]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    addMessage(selectedAgent.id, { sender: 'user', content: inputMessage });
    
    // Simulate agent response
    setTimeout(() => {
      const responses: Record<string, string[]> = {
        chill: ["Got it, I'll handle that.", "No worries, on it.", "Sure thing."],
        focused: ["Processing...", "I'll get right on that.", "Understood."],
        chatty: ["Oh that's interesting! Let me work on that!", "I'd love to help with that!", "Ooh fun task!"],
        sarcastic: ["Fine, I'll do it.", "As if I had a choice...", "*eye roll* Okay."],
        enthusiastic: ["OH THIS IS GONNA BE AMAZING!", "LET'S GOOOOO!", "I'm ON IT! WOO!"],
      };
      const responses_list = responses[selectedAgent.personality];
      const response = responses_list[Math.floor(Math.random() * responses_list.length)];
      addMessage(selectedAgent.id, { sender: 'agent', content: response });
    }, 1000);

    setInputMessage('');
  };

  const handleAssignTask = () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    addTask({
      title: inputMessage.slice(0, 50),
      description: inputMessage,
      assignedTo: selectedAgent.id,
      status: 'in_progress',
      priority: 'medium',
    });

    addMessage(selectedAgent.id, { 
      sender: 'agent', 
      content: `Task assigned! I'll work on: "${inputMessage.slice(0, 50)}..."` 
    });

    setInputMessage('');
  };

  const handleExport = () => {
    if (!selectedAgent) return;
    const data = {
      agent: selectedAgent.name,
      conversations: selectedAgent.conversations,
      tasks: agentTasks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAgent.name}_output.json`;
    a.click();
  };

  if (!selectedAgent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-4 top-20 bottom-4 w-96 z-40"
      >
        <div className="h-full bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ 
                  backgroundColor: colorMap[selectedAgent.color],
                  boxShadow: `0 0 20px ${colorMap[selectedAgent.color]}50`
                }}
              >
                {selectedAgent.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{selectedAgent.role} • {selectedAgent.personality}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectAgent(null)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Agent Stats */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Mood</span>
              <span>{selectedAgent.mood}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${selectedAgent.mood}%`,
                  backgroundColor: selectedAgent.mood > 70 ? '#22c55e' : selectedAgent.mood > 40 ? '#eab308' : '#ef4444'
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Energy</span>
              <span>{selectedAgent.energy}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${selectedAgent.energy}%`,
                  backgroundColor: selectedAgent.energy > 70 ? '#22c55e' : selectedAgent.energy > 40 ? '#eab308' : '#ef4444'
                }}
              />
            </div>
          </div>

          {/* Tasks Section */}
          {agentTasks.length > 0 && (
            <div className="px-4 py-3 border-b border-white/10">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Active Tasks
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {agentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {selectedAgent.conversations.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' 
                        : 'bg-white/10 text-slate-200 border border-white/10'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Voice Waveform (when recording) */}
          {isRecording && (
            <div className="px-4 py-2">
              <div className="flex items-center justify-center gap-1 h-8">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full"
                    animate={{
                      height: [8, 24 + Math.random() * 16, 8],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      delay: i * 0.02,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRecording(!isRecording)}
                className={`${isRecording ? 'text-red-400 bg-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAssignTask}
                disabled={!inputMessage.trim()}
                className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Assign Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex-1 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Replay Mode
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => broadcastToAll("All hands meeting!")}
                className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              >
                <Radio className="w-3 h-3 mr-1" />
                Broadcast
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
