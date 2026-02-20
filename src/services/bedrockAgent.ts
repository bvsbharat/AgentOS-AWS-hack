import type { ToolStep } from '@/types';

const CHAT_URL = 'http://localhost:3001/chat';
const CHAT_STREAM_URL = 'http://localhost:3001/chat/stream';

interface ChatRequest {
  agentName: string;
  role: string;
  personality: string;
  messages: { role: string; content: string }[];
  enableTools?: boolean;
  isTaskExecution?: boolean;
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  toolsUsed?: string[];
  toolSteps?: ToolStep[];
  sessionId?: string;
}

interface Task {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  assignedRole: string;
}

export class BedrockAgentService {
  private sessionIds: Map<string, string> = new Map();

  async chat(
    agentName: string,
    role: string,
    personality: string,
    messages: { role: string; content: string }[],
    options?: { enableTools?: boolean; isTaskExecution?: boolean }
  ): Promise<ChatResponse> {
    const sessionId = this.sessionIds.get(agentName) || undefined;

    const body: ChatRequest = {
      agentName,
      role,
      personality,
      messages,
      enableTools: options?.enableTools,
      isTaskExecution: options?.isTaskExecution,
      sessionId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 330_000); // 5.5 min timeout (above server's 5 min)

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).error || `Chat request failed: ${response.status}`);
    }

    const data = (await response.json()) as ChatResponse;

    if (data.sessionId) {
      this.sessionIds.set(agentName, data.sessionId);
    }

    return data;
  }

  async chatStream(
    agentName: string,
    role: string,
    personality: string,
    messages: { role: string; content: string }[],
    options?: { enableTools?: boolean; isTaskExecution?: boolean },
    callbacks?: {
      onToolCall?: (step: ToolStep) => void;
      onToolResult?: (step: ToolStep) => void;
      onStatus?: (message: string) => void;
    }
  ): Promise<ChatResponse> {
    const sessionId = this.sessionIds.get(agentName) || undefined;

    const body: ChatRequest = {
      agentName,
      role,
      personality,
      messages,
      enableTools: options?.enableTools,
      isTaskExecution: options?.isTaskExecution,
      sessionId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 330_000);

    const response = await fetch(CHAT_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    // Read SSE events from the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: ChatResponse = { response: '' };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            switch (currentEvent) {
              case 'tool_call':
                callbacks?.onToolCall?.(data as ToolStep);
                break;
              case 'tool_result':
                callbacks?.onToolResult?.(data as ToolStep);
                break;
              case 'status':
                callbacks?.onStatus?.(data.message);
                break;
              case 'done':
                finalResult = data as ChatResponse;
                if (data.sessionId) {
                  this.sessionIds.set(agentName, data.sessionId);
                }
                break;
              case 'error':
                throw new Error(data.error || 'Agent stream error');
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('Agent stream error')) throw e;
            // Ignore JSON parse errors for incomplete data
          }
          currentEvent = '';
        }
      }
    }

    return finalResult;
  }

  async executeTaskWithTools(
    taskTitle: string,
    taskDescription: string,
    agentName: string = 'Agent',
    role: string = 'developer',
    personality: string = 'focused'
  ): Promise<{ output: string; success: boolean }> {
    try {
      const result = await this.chat(agentName, role, personality, [
        { role: 'user', content: `Execute this task:\n\nTitle: ${taskTitle}\nDescription: ${taskDescription}\n\nUse the available tools to complete this task. Report what you did.` }
      ], { enableTools: true });

      return {
        output: result.response,
        success: true,
      };
    } catch (error: any) {
      console.error('[BedrockAgent] executeTaskWithTools error:', error);
      return {
        output: `Error: ${error.message || error}`,
        success: false,
      };
    }
  }

  async generateTasksFromIdea(startupIdea: string): Promise<Task[]> {
    try {
      const result = await this.chat('TaskGenerator', 'manager', 'focused', [
        {
          role: 'user',
          content: `Generate a complete task breakdown for this startup idea: ${startupIdea}

Return ONLY a JSON array of tasks with this structure:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "category": "One of: research, design, development, marketing, testing, documentation",
    "priority": "high|medium|low",
    "assignedRole": "One of: developer, designer, researcher, writer, analyst, manager"
  }
]
Generate 8-12 tasks covering all aspects from idea to market launch.`
        }
      ]);

      const jsonMatch = result.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.getDefaultTasks(startupIdea);
    } catch (error) {
      console.error('Task generation error:', error);
      return this.getDefaultTasks(startupIdea);
    }
  }

  private getDefaultTasks(_idea: string): Task[] {
    return [
      { title: 'Market Research & Competitive Analysis', description: 'Research target market, identify competitors', category: 'research', priority: 'high', assignedRole: 'analyst' },
      { title: 'Define Product Requirements', description: 'Create detailed PRD', category: 'documentation', priority: 'high', assignedRole: 'manager' },
      { title: 'Design System & UI Components', description: 'Create design system', category: 'design', priority: 'high', assignedRole: 'designer' },
      { title: 'Setup Project Repository', description: 'Initialize GitHub repo', category: 'development', priority: 'high', assignedRole: 'developer' },
      { title: 'Core Feature Development', description: 'Implement MVP features', category: 'development', priority: 'high', assignedRole: 'developer' },
      { title: 'Create Landing Page', description: 'Design marketing landing page', category: 'development', priority: 'medium', assignedRole: 'developer' },
      { title: 'Social Media Strategy', description: 'Create content calendar', category: 'marketing', priority: 'medium', assignedRole: 'writer' },
      { title: 'Beta Testing Plan', description: 'Define testing strategy', category: 'testing', priority: 'medium', assignedRole: 'analyst' },
      { title: 'Documentation', description: 'Write documentation', category: 'documentation', priority: 'low', assignedRole: 'writer' },
      { title: 'Launch Campaign', description: 'Plan product launch', category: 'marketing', priority: 'high', assignedRole: 'manager' }
    ];
  }
}

export const bedrockAgent = new BedrockAgentService();
