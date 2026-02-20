import { bedrockAgent } from './bedrockAgent';
import type { Agent, Task, ToolStep } from '@/types';

export interface TaskExecutionResult {
  success: boolean;
  output: string;
  toolSteps?: ToolStep[];
  artifacts?: {
    code?: string;
    images?: string[];
    documents?: string[];
    links?: string[];
  };
  error?: string;
}

export interface TaskExecutionCallbacks {
  onToolCall?: (step: ToolStep) => void;
  onToolResult?: (step: ToolStep) => void;
  onStatus?: (message: string) => void;
}

export class TaskExecutor {
  async executeTask(task: Task, agent: Agent, callbacks?: TaskExecutionCallbacks): Promise<TaskExecutionResult> {
    console.log(`[${agent.name}] Executing task: ${task.title}`);

    try {
      const userMessage = this.buildTaskMessage(task, agent.role);
      const collectedSteps: ToolStep[] = [];

      const result = await bedrockAgent.chatStream(
        agent.name,
        agent.role,
        agent.personality,
        [{ role: 'user', content: userMessage }],
        { enableTools: true, isTaskExecution: true },
        {
          onToolCall: (step) => {
            callbacks?.onToolCall?.(step);
          },
          onToolResult: (step) => {
            collectedSteps.push(step);
            callbacks?.onToolResult?.(step);
          },
          onStatus: (message) => {
            callbacks?.onStatus?.(message);
          },
        }
      );

      return {
        success: true,
        output: result.response,
        toolSteps: collectedSteps.length > 0 ? collectedSteps : result.toolSteps,
        artifacts: result.toolsUsed?.length
          ? { documents: [`Tools used: ${result.toolsUsed.join(', ')}`] }
          : undefined,
      };
    } catch (error) {
      console.error('[TaskExecutor] Error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private buildTaskMessage(task: Task, role: string): string {
    const roleInstructions: Record<string, string> = {
      developer: 'Write code, set up repos, debug, or implement features as needed.',
      designer: 'Create design specs, UI layouts, component hierarchies, or visual assets as needed.',
      analyst: 'Analyze data, produce metrics, run competitive analysis, or generate insights as needed.',
      writer: 'Write copy, documentation, social media posts, or content as needed.',
      manager: 'Create plans, set priorities, coordinate deliverables, or define strategy as needed.',
      researcher: 'Research topics, synthesize findings, identify sources, or produce reports as needed.',
    };

    const instruction = roleInstructions[role] || 'Complete the following task.';

    return `Task: ${task.title}\n\nDescription: ${task.description}\n\n${instruction}\n\nUse RUBE_SEARCH_TOOLS to discover relevant tools, then RUBE_MULTI_EXECUTE_TOOL to execute them. Provide a clear summary of what you accomplished.`;
  }

  async generateStartupTasks(idea: string): Promise<Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    assignedRole: string;
  }>> {
    return await bedrockAgent.generateTasksFromIdea(idea);
  }
}

export const taskExecutor = new TaskExecutor();
