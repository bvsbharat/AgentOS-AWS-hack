import { create } from 'zustand';
import type { Agent, Task, Room, Message, AgentStatus, OfficeState } from '@/types';
import { taskExecutor, type TaskExecutionResult } from '@/services/taskExecutor';

interface AgentStore {
  // Agents
  agents: Agent[];
  addAgent: (agent: Omit<Agent, 'id' | 'conversations' | 'mood' | 'energy'>) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setAgentStatus: (id: string, status: AgentStatus) => void;
  moveAgent: (id: string, position: { x: number; z: number }) => void;
  addMessage: (agentId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'progress'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  assignTask: (taskId: string, agentId: string) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  executeTask: (taskId: string) => Promise<TaskExecutionResult>;
  generateStartupTasks: (idea: string) => Promise<void>;
  
  // Rooms
  rooms: Room[];
  
  // Office State
  office: OfficeState;
  setTime: (time: number) => void;
  selectAgent: (id: string | null) => void;
  setShowAgentCreator: (show: boolean) => void;
  setShowTaskBoard: (show: boolean) => void;
  setShowConnectionManager: (show: boolean) => void;
  toggleAllHandsMode: () => void;
  
  // Actions
  broadcastToAll: (message: string) => void;
  delegateTask: (managerId: string, taskId: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultRooms: Room[] = [
  {
    id: 'dev-room-1',
    name: 'Dev Room',
    type: 'dev',
    position: { x: -15, z: -10 },
    size: { width: 20, depth: 15 },
    color: '#1e3a5f',
    desks: [
      { id: 'dev-desk-1', position: { x: -20, z: -18 }, rotation: 0, occupiedBy: null },
      { id: 'dev-desk-2', position: { x: -15, z: -18 }, rotation: 0, occupiedBy: null },
      { id: 'dev-desk-3', position: { x: -10, z: -18 }, rotation: 0, occupiedBy: null },
      { id: 'dev-desk-4', position: { x: -5, z: -18 }, rotation: 0, occupiedBy: null },
      { id: 'dev-desk-5', position: { x: 0, z: -18 }, rotation: 0, occupiedBy: null },
    ]
  },
  {
    id: 'design-studio',
    name: 'Design Studio',
    type: 'design',
    position: { x: -15, z: 10 },
    size: { width: 15, depth: 12 },
    color: '#4a1e5f',
    desks: [
      { id: 'design-desk-1', position: { x: -18, z: 4 }, rotation: 0, occupiedBy: null },
      { id: 'design-desk-2', position: { x: -12, z: 4 }, rotation: 0, occupiedBy: null },
      { id: 'design-desk-3', position: { x: -18, z: 8 }, rotation: 0, occupiedBy: null },
      { id: 'design-desk-4', position: { x: -12, z: 8 }, rotation: 0, occupiedBy: null },
    ]
  },
  {
    id: 'research-lab',
    name: 'Research Lab',
    type: 'research',
    position: { x: 0, z: 15 },
    size: { width: 15, depth: 12 },
    color: '#1e5f3a',
    desks: [
      { id: 'research-desk-1', position: { x: -5, z: 8 }, rotation: 0, occupiedBy: null },
      { id: 'research-desk-2', position: { x: 0, z: 8 }, rotation: 0, occupiedBy: null },
      { id: 'research-desk-3', position: { x: 5, z: 8 }, rotation: 0, occupiedBy: null },
      { id: 'research-desk-4', position: { x: -5, z: 12 }, rotation: 0, occupiedBy: null },
      { id: 'research-desk-5', position: { x: 0, z: 12 }, rotation: 0, occupiedBy: null },
    ]
  },
  {
    id: 'meeting-room',
    name: 'Meeting Room',
    type: 'meeting',
    position: { x: 15, z: 0 },
    size: { width: 18, depth: 15 },
    color: '#5f4a1e',
    desks: [
      { id: 'meeting-table', position: { x: 15, z: 0 }, rotation: 0, occupiedBy: null },
    ]
  },
  {
    id: 'break-room',
    name: 'Break Room',
    type: 'break',
    position: { x: 15, z: 15 },
    size: { width: 12, depth: 12 },
    color: '#5f1e3a',
    desks: [
      { id: 'coffee-area', position: { x: 15, z: 15 }, rotation: 0, occupiedBy: null },
    ]
  },
];

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Sparky',
    role: 'developer',
    personality: 'enthusiastic',
    color: 'blue',
    accessory: 'glasses',
    skills: { python: true, figma: false, webSearch: true, codeReview: true, summarization: false, dataAnalysis: false, writing: false },
    status: 'available',
    position: { x: -20, z: -14 },
    deskPosition: { x: -20, z: -18 },
    room: 'dev-room-1',
    mood: 85,
    energy: 90,
    conversations: [],
  },
  {
    id: 'agent-2',
    name: 'Pixel',
    role: 'designer',
    personality: 'chill',
    color: 'purple',
    accessory: 'headphones',
    skills: { python: false, figma: true, webSearch: true, codeReview: false, summarization: false, dataAnalysis: false, writing: false },
    status: 'busy',
    position: { x: -18, z: 0 },
    deskPosition: { x: -18, z: 4 },
    room: 'design-studio',
    mood: 70,
    energy: 75,
    conversations: [],
  },
  {
    id: 'agent-3',
    name: 'Data',
    role: 'analyst',
    personality: 'focused',
    color: 'green',
    accessory: 'none',
    skills: { python: true, figma: false, webSearch: true, codeReview: false, summarization: true, dataAnalysis: true, writing: true },
    status: 'deep_focus',
    position: { x: 0, z: 4 },
    deskPosition: { x: 0, z: 8 },
    room: 'research-lab',
    mood: 60,
    energy: 50,
    conversations: [],
  },
  {
    id: 'agent-4',
    name: 'Chirp',
    role: 'writer',
    personality: 'chatty',
    color: 'orange',
    accessory: 'hat',
    skills: { python: false, figma: false, webSearch: true, codeReview: false, summarization: true, dataAnalysis: false, writing: true },
    status: 'available',
    position: { x: 15, z: 12 },
    deskPosition: { x: 15, z: 15 },
    room: 'break-room',
    mood: 95,
    energy: 85,
    conversations: [],
  },
  {
    id: 'agent-5',
    name: 'Bolt',
    role: 'manager',
    personality: 'sarcastic',
    color: 'red',
    accessory: 'crown',
    skills: { python: false, figma: false, webSearch: true, codeReview: true, summarization: true, dataAnalysis: true, writing: true },
    status: 'busy',
    position: { x: 15, z: -4 },
    deskPosition: { x: 15, z: 0 },
    room: 'meeting-room',
    mood: 75,
    energy: 80,
    conversations: [],
  },
];

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Research AI Tools 2025',
    description: 'Find and summarize the top 10 AI tools for 2025',
    assignedTo: 'agent-3',
    status: 'in_progress',
    progress: 45,
    createdAt: Date.now(),
    priority: 'high',
  },
  {
    id: 'task-2',
    title: 'Design New Dashboard',
    description: 'Create UI mockups for the analytics dashboard',
    assignedTo: 'agent-2',
    status: 'in_progress',
    progress: 70,
    createdAt: Date.now(),
    priority: 'medium',
  },
  {
    id: 'task-3',
    title: 'Code Review: Auth Module',
    description: 'Review the authentication module implementation',
    assignedTo: null,
    status: 'pending',
    progress: 0,
    createdAt: Date.now(),
    priority: 'high',
  },
];

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: initialAgents,
  tasks: initialTasks,
  rooms: defaultRooms,
  office: {
    time: 14,
    isNight: false,
    selectedAgent: null,
    showAgentCreator: false,
    showTaskBoard: false,
    showConnectionManager: false,
    allHandsMode: false,
  },

  addAgent: (agentData) => {
    const newAgent: Agent = {
      ...agentData,
      id: generateId(),
      mood: 80,
      energy: 100,
      conversations: [],
    };
    set((state) => ({ agents: [...state.agents, newAgent] }));
  },

  removeAgent: (id) => {
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) }));
  },

  updateAgent: (id, updates) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  },

  setAgentStatus: (id, status) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
  },

  moveAgent: (id, position) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, position } : a)),
    }));
  },

  addMessage: (agentId, message) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, conversations: [...a.conversations, newMessage] } : a
      ),
    }));
  },

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      progress: 0,
      createdAt: Date.now(),
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  assignTask: async (taskId, agentId) => {
    const { agents, addMessage, executeTask } = get();
    
    // First assign the task
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, assignedTo: agentId, status: 'in_progress' } : t
      ),
      agents: state.agents.map((a) =>
        a.id === agentId ? { ...a, status: 'busy' } : a
      ),
    }));

    // Get agent info
    const agent = agents.find(a => a.id === agentId);
    const task = get().tasks.find(t => t.id === taskId);
    
    if (agent && task) {
      // Notify agent is starting work
      addMessage(agentId, {
        sender: 'agent',
        content: `🎯 Starting task: "${task.title}"\n\n${task.description.slice(0, 100)}...`
      });

      // Execute the task automatically using Bedrock AI
      await executeTask(taskId);
    }
  },

  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'completed', progress: 100, completedAt: Date.now() } : t
      ),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  executeTask: async (taskId) => {
    const { tasks, agents, addMessage, updateTask, completeTask } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.assignedTo) {
      return { success: false, output: '', error: 'Task not found or not assigned' };
    }

    const agent = agents.find((a) => a.id === task.assignedTo);
    if (!agent) {
      return { success: false, output: '', error: 'Assigned agent not found' };
    }

    // Update task status to in_progress
    updateTask(taskId, { status: 'in_progress' });
    
    // Add message that agent is working
    addMessage(agent.id, { 
      sender: 'agent', 
      content: `Starting task: "${task.title}"...` 
    });

    // Simulate progress while working
    const progressInterval = setInterval(() => {
      const currentTask = get().tasks.find(t => t.id === taskId);
      if (currentTask && currentTask.progress < 90) {
        updateTask(taskId, { progress: currentTask.progress + 10 });
      }
    }, 1000);

    try {
      // Execute the actual task using Bedrock AI
      const result = await taskExecutor.executeTask(task, agent);

      clearInterval(progressInterval);

      if (result.success) {
        completeTask(taskId);
        // Reset agent status to available
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agent.id ? { ...a, status: 'available' } : a
          ),
        }));
        addMessage(agent.id, { 
          sender: 'agent', 
          content: `✅ Completed: "${task.title}"\n\n${result.output?.slice(0, 300) || 'Task completed successfully!'}...` 
        });
      } else {
        updateTask(taskId, { status: 'pending' });
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agent.id ? { ...a, status: 'available' } : a
          ),
        }));
        addMessage(agent.id, { 
          sender: 'agent', 
          content: `❌ Failed to complete: "${task.title}"\nError: ${result.error}` 
        });
      }

      return result;
    } catch (error) {
      clearInterval(progressInterval);
      updateTask(taskId, { status: 'pending' });
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agent.id ? { ...a, status: 'available' } : a
        ),
      }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage(agent.id, { 
        sender: 'agent', 
        content: `❌ Error executing task: ${errorMessage}` 
      });
      return { success: false, output: '', error: errorMessage };
    }
  },

  generateStartupTasks: async (idea) => {
    const { addTask } = get();
    
    try {
      const generatedTasks = await taskExecutor.generateStartupTasks(idea);
      
      // Add each generated task
      generatedTasks.forEach((task) => {
        addTask({
          title: task.title,
          description: task.description,
          assignedTo: null,
          status: 'pending',
          priority: task.priority,
        });
      });
    } catch (error) {
      console.error('Failed to generate startup tasks:', error);
    }
  },

  setTime: (time) => {
    set((state) => ({
      office: { ...state.office, time, isNight: time < 6 || time > 20 },
    }));
  },

  selectAgent: (id) => {
    set((state) => ({ office: { ...state.office, selectedAgent: id } }));
  },

  setShowAgentCreator: (show) => {
    set((state) => ({ office: { ...state.office, showAgentCreator: show } }));
  },

  setShowTaskBoard: (show) => {
    set((state) => ({ office: { ...state.office, showTaskBoard: show } }));
  },

  setShowConnectionManager: (show) => {
    set((state) => ({ office: { ...state.office, showConnectionManager: show } }));
  },

  toggleAllHandsMode: () => {
    set((state) => ({
      office: { ...state.office, allHandsMode: !state.office.allHandsMode },
    }));
  },

  broadcastToAll: (message) => {
    const { agents } = get();
    agents.forEach((agent) => {
      get().addMessage(agent.id, { sender: 'user', content: message });
    });
  },

  delegateTask: (managerId, taskId) => {
    const { agents, tasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Find available agents with relevant skills
    const availableAgents = agents.filter(
      (a) => a.id !== managerId && a.status === 'available'
    );

    if (availableAgents.length > 0) {
      const selectedAgent = availableAgents[0];
      get().assignTask(taskId, selectedAgent.id);
      get().setAgentStatus(selectedAgent.id, 'busy');
    }
  },
}));
