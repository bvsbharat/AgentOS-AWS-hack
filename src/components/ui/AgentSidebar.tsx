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
  AlertCircle,
  Loader2,
  ChevronRight,
  XCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAgentStore } from '@/store/agentStore';
import { bedrockAgent } from '@/services/bedrockAgent';
import { speak, stop as stopTTS, getVoiceForRole } from '@/services/ttsService';
import { startRecording, stopRecording, isRecording as isSttRecording } from '@/services/sttService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { AgentColor, Message } from '@/types';

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

function parseReasoning(content: string): { reasoning: string | null; response: string } {
  const match = content.match(/💭\s*Reasoning:\s*([\s\S]*?)(?:\n\n)([\s\S]*)/);
  if (match) {
    return { reasoning: match[1].trim(), response: match[2].trim() };
  }
  return { reasoning: null, response: content };
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mt-2.5 mb-1 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-white">{children}</h3>,
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-');
          if (isBlock) {
            return (
              <code className="block bg-black/30 rounded-md px-2.5 py-2 my-1.5 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-cyan-300">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-1.5">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-cyan-500/50 pl-2.5 my-1.5 text-slate-300 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            {children}
          </a>
        ),
        hr: () => <hr className="border-white/10 my-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function ChatMessageContent({ content }: { content: string }) {
  const { reasoning, response } = parseReasoning(content);
  if (!reasoning) return <MarkdownRenderer content={content} />;
  return (
    <>
      <details className="mb-1.5">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1 select-none">
          <ChevronRight className="w-3 h-3 transition-transform details-open:rotate-90" />
          Reasoning
        </summary>
        <p className="text-xs text-slate-400 mt-1 pl-4 border-l border-white/10">{reasoning}</p>
      </details>
      <MarkdownRenderer content={response} />
    </>
  );
}

function ToolStepBubble({ message }: { message: Message }) {
  const step = message.toolStep;
  if (!step) return null;

  const isSuccess = step.status === 'success';
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1 max-w-[90%]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border text-left ${
          isSuccess
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
        ) : (
          <XCircle className="w-3 h-3 flex-shrink-0" />
        )}
        <span className="truncate">{step.action}</span>
      </button>
      {isOpen && (
        <div className="px-3 py-2 rounded-md text-[10px] bg-white/5 border border-white/10 text-slate-300 space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="uppercase tracking-wide">{step.toolName}</span>
            <span>•</span>
            <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="whitespace-pre-wrap">{step.action}</div>
          {step.summary && <div className="whitespace-pre-wrap text-slate-400">{step.summary}</div>}
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((a) => a.id === office.selectedAgent);
  const agentTasks = tasks.filter((t) => t.assignedTo === office.selectedAgent);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedAgent?.conversations]);

  // Stop TTS when agent changes or TTS is toggled off
  useEffect(() => {
    stopTTS();
    setIsTtsSpeaking(false);
  }, [selectedAgent?.id, ttsEnabled]);

  // Play greeting when agent is selected
  useEffect(() => {
    if (selectedAgent && selectedAgent.conversations.length === 0) {
      const greetings = personalityGreetings[selectedAgent.personality];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      addMessage(selectedAgent.id, { sender: 'agent', content: greeting });
    }
  }, [selectedAgent?.id]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedAgent || isLoading) return;

    const userMsg = inputMessage;
    addMessage(selectedAgent.id, { sender: 'user', content: userMsg });
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history (last 10 messages)
      const recentMessages = selectedAgent.conversations.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));
      // Append the current message
      recentMessages.push({ role: 'user', content: userMsg });

      const result = await bedrockAgent.chat(
        selectedAgent.name,
        selectedAgent.role,
        selectedAgent.personality,
        recentMessages
      );

      addMessage(selectedAgent.id, { sender: 'agent', content: result.response });

      if (ttsEnabled) {
        const voice = getVoiceForRole(selectedAgent.role);
        setIsTtsSpeaking(true);
        speak(result.response, voice).catch(err => {
          console.error('[AgentSidebar] TTS error:', err);
        }).finally(() => {
          setIsTtsSpeaking(false);
        });
      }
    } catch (error) {
      console.error('[AgentSidebar] Chat error:', error);
      addMessage(selectedAgent.id, { sender: 'agent', content: 'Sorry, I had trouble processing that.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      setIsRecording(false);
      setIsTranscribing(true);
      try {
        const text = await stopRecording();
        if (text && text.trim()) {
          setInputMessage(text.trim());
          // Auto-send after a tick so inputMessage is set
          setTimeout(() => {
            // We need to send directly since handleSendMessage reads inputMessage from state
            if (!selectedAgent || isLoading) return;
            addMessage(selectedAgent.id, { sender: 'user', content: text.trim() });
            setIsLoading(true);

            const recentMessages = selectedAgent.conversations.slice(-10).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content
            }));
            recentMessages.push({ role: 'user', content: text.trim() });

            bedrockAgent.chat(
              selectedAgent.name,
              selectedAgent.role,
              selectedAgent.personality,
              recentMessages
            ).then((result) => {
              addMessage(selectedAgent.id, { sender: 'agent', content: result.response });
              if (ttsEnabled) {
                const voice = getVoiceForRole(selectedAgent.role);
                setIsTtsSpeaking(true);
                speak(result.response, voice).catch(err => {
                  console.error('[AgentSidebar] TTS error:', err);
                }).finally(() => {
                  setIsTtsSpeaking(false);
                });
              }
            }).catch((error) => {
              console.error('[AgentSidebar] Chat error:', error);
              addMessage(selectedAgent.id, { sender: 'agent', content: 'Sorry, I had trouble processing that.' });
            }).finally(() => {
              setIsLoading(false);
            });

            setInputMessage('');
          }, 0);
        }
      } catch (err) {
        console.error('[AgentSidebar] STT error:', err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        console.error('[AgentSidebar] Mic access error:', err);
      }
    }
  };

  const handleAssignTask = () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    addTask({
      title: inputMessage.slice(0, 50),
      description: inputMessage,
      assignedTo: selectedAgent.id,
      status: 'pending',
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
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={isExpanded ? "fixed left-0 right-0 top-14 bottom-0 h-[calc(100vh-3.5rem)] z-40" : "fixed left-0 right-0 bottom-0 h-[36vh] max-h-[360px] min-h-[220px] z-40"}
      >
        <div className="h-full bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shadow-2xl overflow-hidden flex flex-col relative pt-4">
          <div className="absolute right-2 top-1 z-10 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`${ttsEnabled ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'} h-7 w-7`}
              title={ttsEnabled ? 'Disable TTS' : 'Enable TTS'}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white hover:bg-white/10 h-7 w-7"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectAgent(null)}
              className="text-slate-400 hover:text-white hover:bg-white/10 h-7 w-7"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tasks Section */}
          {agentTasks.length > 0 && (
            <div className="px-2 py-2 border-b border-white/10">
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Active Tasks
              </h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {agentTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-0.5 py-1">
            <div className="space-y-3">
              {selectedAgent.conversations.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'tool_step' ? (
                    <ToolStepBubble message={msg} />
                  ) : (
                    <div className={`max-w-[90%] flex items-center gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1"
                        style={{ backgroundColor: msg.sender === 'user' ? '#0ea5e9' : colorMap[selectedAgent.color] }}
                      >
                        {msg.sender === 'user' ? 'U' : selectedAgent.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {msg.sender === 'user' ? 'You' : selectedAgent.name}
                      </span>
                      <div
                        className={`px-2.5 py-2 rounded-md text-xs font-mono tracking-tight ${
                          msg.sender === 'user'
                            ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/30'
                            : 'bg-black/40 text-slate-200 border border-white/10'
                        }`}
                      >
                        {msg.sender === 'agent' ? <ChatMessageContent content={msg.content} /> : msg.content}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[90%] px-2.5 py-2 rounded-md text-xs font-mono bg-black/40 text-slate-400 border border-white/10 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </div>
                </motion.div>
              )}
              {isTranscribing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="px-3 py-1.5 rounded-md text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-2 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Transcribing...
                  </div>
                </motion.div>
              )}
              {isTtsSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="px-3 py-1.5 rounded-md text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-2 font-mono">
                    <Volume2 className="w-3 h-3" />
                    Speaking...
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Voice Waveform (when recording) */}
          {isRecording && (
            <div className="px-2 py-1.5">
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
          <div className="px-2 py-2 border-t border-white/10">
            <div className="relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full h-11 pl-9 pr-11 bg-black/40 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm rounded-md"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMicToggle}
                disabled={isTranscribing || isLoading}
                className={`${isRecording ? 'text-red-400 bg-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'} absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7`}
              >
                <Mic className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50 absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAssignTask}
                disabled={!inputMessage.trim()}
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
                title="Assign Task"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                title="Export"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                title="Replay Mode"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => broadcastToAll("All hands meeting!")}
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10"
                title="Broadcast"
              >
                <Radio className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
