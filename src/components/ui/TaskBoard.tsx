import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Filter, Search, CheckCircle2, Clock, AlertCircle, FileText, Play, Loader2 } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Task, TaskStatus } from '@/types';

const statusColumns: { id: TaskStatus; label: string; color: string; icon: typeof CheckCircle2 }[] = [
  { id: 'pending', label: 'Pending', color: '#6b7280', icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6', icon: AlertCircle },
  { id: 'review', label: 'Review', color: '#eab308', icon: FileText },
  { id: 'completed', label: 'Completed', color: '#22c55e', icon: CheckCircle2 },
];

const priorityColors = {
  low: 'bg-slate-600',
  medium: 'bg-blue-500',
  high: 'bg-red-500',
};

function TaskCard({ task, agents }: { task: Task; agents: { id: string; name: string; color: string }[] }) {
  const updateTask = useAgentStore((state) => state.updateTask);
  const completeTask = useAgentStore((state) => state.completeTask);
  const deleteTask = useAgentStore((state) => state.deleteTask);
  const executeTask = useAgentStore((state) => state.executeTask);
  const [isExecuting, setIsExecuting] = useState(false);

  const assignedAgent = agents.find((a) => a.id === task.assignedTo);

  const handleStatusChange = () => {
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'review', 'completed'];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    if (nextStatus === 'completed') {
      completeTask(task.id);
    } else {
      updateTask(task.id, { status: nextStatus });
    }
  };

  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.assignedTo || isExecuting) return;
    
    setIsExecuting(true);
    await executeTask(task.id);
    setIsExecuting(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-800/50 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
      onClick={handleStatusChange}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-white text-sm">{task.title}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTask(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {task.status === 'in_progress' && (
        <div className="mt-3">
          <Progress value={task.progress} className="h-1.5" />
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${priorityColors[task.priority]} text-white`}
          >
            {task.priority}
          </Badge>
          {assignedAgent && (
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-medium"
              style={{ backgroundColor: assignedAgent.color }}
            >
              {assignedAgent.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.assignedTo && task.status !== 'completed' && (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isExecuting 
                  ? 'bg-cyan-500/30 text-cyan-300 cursor-wait' 
                  : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
              }`}
            >
              {isExecuting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isExecuting ? 'Running...' : 'Execute'}
            </button>
          )}
          <span className="text-xs text-slate-500">
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function TaskBoard() {
  const tasks = useAgentStore((state) => state.tasks);
  const agents = useAgentStore((state) => state.agents);
  const showTaskBoard = useAgentStore((state) => state.office.showTaskBoard);
  const setShowTaskBoard = useAgentStore((state) => state.setShowTaskBoard);
  const addTask = useAgentStore((state) => state.addTask);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const tasksByStatus = statusColumns.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((t) => t.status === column.id),
  }));

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle,
      description: newTaskDesc,
      assignedTo: null,
      status: 'pending',
      priority: 'medium',
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAddTask(false);
  };

  if (!showTaskBoard) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setShowTaskBoard(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl h-[80vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Global Task Board</h2>
              <p className="text-sm text-slate-400">
                {tasks.length} tasks • {tasks.filter((t) => t.status === 'completed').length} completed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowAddTask(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTaskBoard(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Add Task Form */}
          <AnimatePresence>
            {showAddTask && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-white/10 overflow-hidden"
              >
                <div className="p-4 bg-white/5">
                  <div className="flex gap-3">
                    <Input
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Input
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Description..."
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                    <Button
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white disabled:opacity-50"
                    >
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddTask(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kanban Board */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex gap-4 p-6 min-w-max">
                {tasksByStatus.map((column) => (
                  <div key={column.id} className="w-72 flex-shrink-0">
                    {/* Column Header */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg mb-3"
                      style={{ backgroundColor: `${column.color}20` }}
                    >
                      <div className="flex items-center gap-2">
                        <column.icon className="w-4 h-4" style={{ color: column.color }} />
                        <span className="font-medium text-white">{column.label}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {column.tasks.length}
                      </Badge>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {column.tasks.map((task) => (
                          <TaskCard key={task.id} task={task} agents={agents} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
