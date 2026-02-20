import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AgentRole, AgentPersonality, AgentColor, AccessoryType, AgentSkills } from '@/types';

const roles: { value: AgentRole; label: string; icon: string }[] = [
  { value: 'developer', label: 'Developer', icon: '💻' },
  { value: 'designer', label: 'Designer', icon: '🎨' },
  { value: 'researcher', label: 'Researcher', icon: '🔬' },
  { value: 'writer', label: 'Writer', icon: '✍️' },
  { value: 'analyst', label: 'Analyst', icon: '📊' },
  { value: 'manager', label: 'Manager', icon: '👔' },
];

const personalities: { value: AgentPersonality; label: string; description: string }[] = [
  { value: 'chill', label: 'Chill', description: 'Relaxed and easy-going' },
  { value: 'focused', label: 'Focused', description: 'Serious and efficient' },
  { value: 'chatty', label: 'Chatty', description: 'Friendly and talkative' },
  { value: 'sarcastic', label: 'Sarcastic', description: 'Witty and dry humor' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'High energy and excited' },
];

const colors: { value: AgentColor; label: string; hex: string }[] = [
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#22c55e' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'yellow', label: 'Yellow', hex: '#eab308' },
  { value: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
];

const accessories: { value: AccessoryType; label: string; icon: string }[] = [
  { value: 'none', label: 'None', icon: '❌' },
  { value: 'glasses', label: 'Glasses', icon: '👓' },
  { value: 'headphones', label: 'Headphones', icon: '🎧' },
  { value: 'hat', label: 'Hat', icon: '🎩' },
  { value: 'bowtie', label: 'Bowtie', icon: '🎀' },
  { value: 'crown', label: 'Crown', icon: '👑' },
  { value: 'sunglasses', label: 'Sunglasses', icon: '🕶️' },
];

const defaultSkills: AgentSkills = {
  python: false,
  figma: false,
  webSearch: true,
  codeReview: false,
  summarization: false,
  dataAnalysis: false,
  writing: false,
};

export function AgentCreator() {
  const showAgentCreator = useAgentStore((state) => state.office.showAgentCreator);
  const setShowAgentCreator = useAgentStore((state) => state.setShowAgentCreator);
  const addAgent = useAgentStore((state) => state.addAgent);
  const rooms = useAgentStore((state) => state.rooms);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('developer');
  const [personality, setPersonality] = useState<AgentPersonality>('chill');
  const [color, setColor] = useState<AgentColor>('blue');
  const [accessory, setAccessory] = useState<AccessoryType>('none');
  const [skills, setSkills] = useState<AgentSkills>(defaultSkills);

  const resetForm = () => {
    setStep(1);
    setName('');
    setRole('developer');
    setPersonality('chill');
    setColor('blue');
    setAccessory('none');
    setSkills(defaultSkills);
  };

  const handleClose = () => {
    setShowAgentCreator(false);
    resetForm();
  };

  const handleCreate = () => {
    // Find an available desk in the appropriate room
    const targetRoom = rooms.find((r) => r.type === (role === 'developer' ? 'dev' : role === 'designer' ? 'design' : role === 'researcher' ? 'research' : 'meeting'));
    const availableDesk = targetRoom?.desks.find((d) => !d.occupiedBy);

    addAgent({
      name: name || 'New Agent',
      role,
      personality,
      color,
      accessory,
      skills,
      status: 'available',
      position: availableDesk ? availableDesk.position : { x: 0, z: 0 },
      deskPosition: availableDesk ? availableDesk.position : { x: 0, z: 0 },
      room: targetRoom?.id || 'dev-room-1',
    });

    handleClose();
  };

  const toggleSkill = (skill: keyof AgentSkills) => {
    setSkills((prev) => ({ ...prev, [skill]: !prev[skill] }));
  };

  if (!showAgentCreator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Hire New Agent</h2>
                <p className="text-sm text-slate-400">Create your perfect AI teammate</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 px-6 py-4">
            {[1, 2, 3, 4].map((s) => (
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
                <div>
                  <Label className="text-white mb-2 block">Agent Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter agent name..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <Label className="text-white mb-3 block">Select Role</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border transition-all ${
                          role === r.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{r.icon}</span>
                        <span className="text-sm text-white">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-white mb-3 block">Personality</Label>
                  <div className="space-y-2">
                    {personalities.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPersonality(p.value)}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                          personality === p.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium text-white block">{p.label}</span>
                        <span className="text-sm text-slate-400">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-white mb-3 block">Color</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={`p-4 rounded-xl border transition-all ${
                          color === c.value
                            ? 'border-white scale-110'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        <span className="text-sm font-medium text-white drop-shadow-md">
                          {c.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block">Accessory</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {accessories.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setAccessory(a.value)}
                        className={`p-4 rounded-xl border transition-all ${
                          accessory === a.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-2xl mb-1 block">{a.icon}</span>
                        <span className="text-xs text-white">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-white mb-3 block">Skills</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(skills).map(([skill, enabled]) => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill as keyof AgentSkills)}
                        className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                          enabled
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            enabled ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'
                          }`}
                        >
                          {enabled && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className="text-sm text-white capitalize">
                          {skill.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Label className="text-white mb-3 block">Preview</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: colors.find((c) => c.value === color)?.hex }}
                    >
                      {name.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{name || 'Unnamed Agent'}</p>
                      <p className="text-sm text-slate-400 capitalize">
                        {role} • {personality}
                      </p>
                      <p className="text-xs text-slate-500">
                        {accessory !== 'none' && `Wearing: ${accessory}`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Deploy Agent
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
