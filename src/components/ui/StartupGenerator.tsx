import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Rocket, Lightbulb, Zap, Code, Palette, TrendingUp } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const startupTemplates = [
  {
    name: 'Vibe Designer Tool',
    icon: Palette,
    description: 'AI-powered design tool for creating beautiful visuals with natural language. Features include: text-to-design, AI-generated color palettes, smart layout suggestions, and instant prototype generation.',
    color: 'from-purple-500 to-pink-500',
    tasks: [
      { title: 'Market Research: Design Tools', description: 'Research top AI design tools (Midjourney, Canva AI, Figma AI). Analyze features, pricing, and market gaps.', category: 'research', priority: 'high', assignedRole: 'researcher' },
      { title: 'Define Product Requirements', description: 'Create detailed PRD with features: text-to-design, AI palettes, smart layouts, prototype generation.', category: 'documentation', priority: 'high', assignedRole: 'manager' },
      { title: 'Design System & Brand', description: 'Create design system, color palette, typography, logo concept, and brand guidelines.', category: 'design', priority: 'high', assignedRole: 'designer' },
      { title: 'Setup GitHub Repository', description: 'Initialize repo, setup CI/CD, configure development environment, add README.', category: 'development', priority: 'high', assignedRole: 'developer' },
      { title: 'Core AI Features Implementation', description: 'Implement text-to-design engine, AI color palette generator, smart layout algorithms.', category: 'development', priority: 'high', assignedRole: 'developer' },
      { title: 'Landing Page Development', description: 'Build marketing landing page with demo video, feature showcase, and early access signup.', category: 'development', priority: 'medium', assignedRole: 'developer' },
      { title: 'Social Media Campaign', description: 'Create Twitter/X posts, LinkedIn content, Instagram visuals for launch.', category: 'marketing', priority: 'medium', assignedRole: 'writer' },
      { title: 'Marketing Images Generation', description: 'Generate hero images, social media posts, product screenshots using Gemini.', category: 'design', priority: 'medium', assignedRole: 'designer' },
      { title: 'Launch on Product Hunt', description: 'Prepare Product Hunt submission, create teaser campaign, plan launch day activities.', category: 'marketing', priority: 'high', assignedRole: 'manager' },
      { title: 'Beta Testing & Feedback', description: 'Recruit beta users, collect feedback, iterate on product improvements.', category: 'testing', priority: 'medium', assignedRole: 'analyst' },
    ]
  },
  {
    name: 'Code Assistant Pro',
    icon: Code,
    description: 'Intelligent coding companion with context-aware suggestions, automated code reviews, and real-time debugging.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Market Analytics AI',
    icon: TrendingUp,
    description: 'Real-time market analysis and predictive insights platform with AI-powered forecasting.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Content Studio',
    icon: Zap,
    description: 'All-in-one content creation and distribution platform with AI writing and scheduling.',
    color: 'from-orange-500 to-yellow-500',
  },
];

export function StartupGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [idea, setIdea] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof startupTemplates[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateStartupTasks = useAgentStore((state) => state.generateStartupTasks);
  const setShowTaskBoard = useAgentStore((state) => state.setShowTaskBoard);
  const addTask = useAgentStore((state) => state.addTask);

  const handleTemplateSelect = (template: typeof startupTemplates[0]) => {
    setSelectedTemplate(template);
    setIdea(template.description);
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    
    setIsGenerating(true);

    if (selectedTemplate && 'tasks' in selectedTemplate && selectedTemplate.tasks) {
      selectedTemplate.tasks.forEach((task) => {
        addTask({
          title: task.title,
          description: task.description,
          assignedTo: null,
          status: 'pending',
          priority: task.priority as 'low' | 'medium' | 'high',
        });
      });
    } else {
      await generateStartupTasks(idea);
    }
    setIsGenerating(false);
    setIsOpen(false);
    setStep(1);
    setIdea('');
    
    // Open task board to show generated tasks
    setTimeout(() => setShowTaskBoard(true), 500);
  };

  const handleCustomIdea = () => {
    if (idea.trim()) {
      setStep(2);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-30 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-cyan-500/30 flex items-center gap-2 font-medium"
      >
        <Rocket className="w-5 h-5" />
        <span>Launch Startup</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Startup Generator</h2>
                <p className="text-sm text-slate-400">
                  {step === 1 ? 'Choose a template or enter your idea' : 'Review and generate tasks'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 px-6 py-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Templates */}
                <div>
                  <Label className="text-white mb-3 block flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Choose a Template
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {startupTemplates.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                          <template.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-medium text-white mb-1">{template.name}</h4>
                        <p className="text-xs text-slate-400">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-4 text-sm text-slate-500">or enter custom idea</span>
                  </div>
                </div>

                {/* Custom Idea */}
                <div>
                  <Label className="text-white mb-2 block">Your Startup Idea</Label>
                  <Textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Describe your startup idea in detail..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[100px]"
                  />
                  <Button
                    onClick={handleCustomIdea}
                    disabled={!idea.trim()}
                    className="mt-3 w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Continue with Custom Idea
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Label className="text-white mb-2 block">Startup Idea</Label>
                  <p className="text-slate-300">{idea}</p>
                </div>

                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-cyan-400 mb-1">AI Task Generation</h4>
                      <p className="text-sm text-slate-400">
                        Our AI agents will analyze your idea and generate a complete task breakdown 
                        covering research, design, development, marketing, and launch activities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-cyan-400">~10</div>
                    <div className="text-xs text-slate-500">Tasks Generated</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-purple-400">6</div>
                    <div className="text-xs text-slate-500">Agent Roles</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-green-400">Auto</div>
                    <div className="text-xs text-slate-500">Assignment</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Back
              </Button>
            )}
            {step === 1 && <div />}
            
            {step === 2 && (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-2"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Generating Tasks...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Tasks
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Label component for the modal
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium mb-2 block ${className}`}>
      {children}
    </label>
  );
}
