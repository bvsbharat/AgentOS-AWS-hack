export type AgentRole = 'developer' | 'designer' | 'researcher' | 'writer' | 'analyst' | 'manager';
export type AgentPersonality = 'chill' | 'focused' | 'chatty' | 'sarcastic' | 'enthusiastic';
export type AgentStatus = 'available' | 'busy' | 'deep_focus' | 'sleeping';
export type AgentColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'cyan' | 'pink';
export type AccessoryType = 'none' | 'glasses' | 'headphones' | 'hat' | 'bowtie' | 'crown' | 'sunglasses';

export interface AgentSkills {
  python: boolean;
  figma: boolean;
  webSearch: boolean;
  codeReview: boolean;
  summarization: boolean;
  dataAnalysis: boolean;
  writing: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  personality: AgentPersonality;
  color: AgentColor;
  accessory: AccessoryType;
  skills: AgentSkills;
  status: AgentStatus;
  position: { x: number; z: number };
  targetPosition?: { x: number; z: number };
  deskPosition?: { x: number; z: number };
  room: string;
  mood: number; // 0-100
  energy: number; // 0-100
  currentTask?: string;
  conversations: Message[];
}

export interface ToolStep {
  id: string;
  toolName: string;
  action: string;
  status: 'success' | 'error';
  summary: string;
  timestamp: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  taskId?: string;
  toolStep: ToolStep;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: number;
  type?: 'chat' | 'tool_step';
  toolStep?: ToolStep;
}

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string | null;
  status: TaskStatus;
  progress: number;
  createdAt: number;
  completedAt?: number;
  result?: string;
  subtasks?: Task[];
  priority: 'low' | 'medium' | 'high';
  toolSteps?: ToolStep[];
}

export interface Room {
  id: string;
  name: string;
  type: 'dev' | 'design' | 'research' | 'meeting' | 'break';
  position: { x: number; z: number };
  size: { width: number; depth: number };
  color: string;
  desks: Desk[];
}

export interface Desk {
  id: string;
  position: { x: number; z: number };
  rotation: number;
  occupiedBy: string | null;
}

export interface OfficeState {
  time: number; // 0-24 hours
  isNight: boolean;
  selectedAgent: string | null;
  showAgentCreator: boolean;
  showTaskBoard: boolean;
  showConnectionManager: boolean;
  allHandsMode: boolean;
}
