import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

interface Task {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  assignedRole: string;
}

export class BedrockAgentService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(region: string = 'us-east-1') {
    this.client = new BedrockRuntimeClient({ 
      region,
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
      }
    });
    // Using Claude 3.5 Sonnet on Bedrock (Kimi 2.5 available in some regions)
    this.modelId = 'anthropic.claude-3-5-sonnet-20241022';
  }

  private isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_AWS_ACCESS_KEY_ID && 
      import.meta.env.VITE_AWS_SECRET_ACCESS_KEY &&
      import.meta.env.VITE_AWS_ACCESS_KEY_ID !== 'your_aws_access_key_id'
    );
  }

  async generateResponse(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.isConfigured()) {
      return this.getMockResponse(prompt);
    }

    try {
      const body = {
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: 4096,
        temperature: 0.7,
      };

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: JSON.stringify(body),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content?.[0]?.text || responseBody.completion || 'No response generated';
    } catch (error) {
      console.error('Bedrock API Error:', error);
      return this.getMockResponse(prompt);
    }
  }

  async generateTasksFromIdea(startupIdea: string): Promise<Task[]> {
    const systemPrompt = `You are a startup task generator. Given a startup idea, break it down into specific, actionable tasks.
    Return ONLY a JSON array of tasks with this structure:
    [
      {
        "title": "Task title",
        "description": "Detailed description of what needs to be done",
        "category": "One of: research, design, development, marketing, testing, documentation",
        "priority": "high|medium|low",
        "assignedRole": "One of: developer, designer, researcher, writer, analyst, manager"
      }
    ]
    Generate 8-12 tasks covering all aspects from idea to market launch.`;

    try {
      const response = await this.generateResponse(
        `Generate a complete task breakdown for this startup idea: ${startupIdea}`,
        systemPrompt
      );
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.getDefaultTasks(startupIdea);
    } catch (error) {
      console.error('Task generation error:', error);
      return this.getDefaultTasks(startupIdea);
    }
  }

  async generateCode(task: string, language: string = 'typescript'): Promise<string> {
    const systemPrompt = `You are an expert ${language} developer. Write clean, production-ready code with comments.
    Return ONLY the code without explanations.`;

    return this.generateResponse(`Write ${language} code for: ${task}`, systemPrompt);
  }

  async generateDesignSpecs(feature: string): Promise<string> {
    const systemPrompt = `You are a UI/UX designer. Create detailed design specifications including:
    - Color palette
    - Typography
    - Layout structure
    - Component hierarchy
    - Interaction patterns`;

    return this.generateResponse(`Create design specs for: ${feature}`, systemPrompt);
  }

  async generateMarketingCopy(product: string, platform: string): Promise<string> {
    const systemPrompt = `You are a marketing copywriter. Create engaging, platform-optimized content.
    Include relevant hashtags and calls-to-action.`;

    return this.generateResponse(`Write ${platform} marketing copy for: ${product}`, systemPrompt);
  }

  async researchTopic(topic: string): Promise<string> {
    const systemPrompt = `You are a research analyst. Provide comprehensive research with:
    - Key findings
    - Market insights
    - Competitive analysis
    - Recommendations`;

    return this.generateResponse(`Research and analyze: ${topic}`, systemPrompt);
  }

  private getMockResponse(prompt: string): string {
    // Mock responses for demo when API is not available
    if (prompt.includes('task breakdown') || prompt.includes('startup idea')) {
      return JSON.stringify(this.getDefaultTasks(prompt));
    }
    if (prompt.includes('code')) {
      return '// Generated code would appear here\n// API credentials needed for actual generation';
    }
    if (prompt.includes('design')) {
      return 'Design specifications would be generated here with API access';
    }
    if (prompt.includes('marketing')) {
      return 'Marketing copy would be generated here with API access';
    }
    return 'AI response would appear here. Configure AWS credentials for actual Bedrock integration.';
  }

  private getDefaultTasks(_idea: string): Array<{
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    assignedRole: string;
  }> {
    return [
      {
        title: 'Market Research & Competitive Analysis',
        description: 'Research target market, identify competitors, analyze market gaps and opportunities',
        category: 'research',
        priority: 'high',
        assignedRole: 'analyst'
      },
      {
        title: 'Define Product Requirements',
        description: 'Create detailed PRD with features, user stories, and technical requirements',
        category: 'documentation',
        priority: 'high',
        assignedRole: 'manager'
      },
      {
        title: 'Design System & UI Components',
        description: 'Create design system, component library, and key screen mockups',
        category: 'design',
        priority: 'high',
        assignedRole: 'designer'
      },
      {
        title: 'Setup Project Repository',
        description: 'Initialize GitHub repo, setup CI/CD pipeline, configure development environment',
        category: 'development',
        priority: 'high',
        assignedRole: 'developer'
      },
      {
        title: 'Core Feature Development',
        description: 'Implement MVP core features and functionality',
        category: 'development',
        priority: 'high',
        assignedRole: 'developer'
      },
      {
        title: 'Create Landing Page',
        description: 'Design and develop marketing landing page with signup flow',
        category: 'development',
        priority: 'medium',
        assignedRole: 'developer'
      },
      {
        title: 'Social Media Strategy',
        description: 'Create content calendar, brand voice guidelines, and initial posts',
        category: 'marketing',
        priority: 'medium',
        assignedRole: 'writer'
      },
      {
        title: 'Beta Testing Plan',
        description: 'Define testing strategy, create test cases, recruit beta users',
        category: 'testing',
        priority: 'medium',
        assignedRole: 'analyst'
      },
      {
        title: 'Documentation',
        description: 'Write user documentation, API docs, and README',
        category: 'documentation',
        priority: 'low',
        assignedRole: 'writer'
      },
      {
        title: 'Launch Campaign',
        description: 'Plan and execute product launch on Product Hunt, Twitter, and relevant platforms',
        category: 'marketing',
        priority: 'high',
        assignedRole: 'manager'
      }
    ];
  }
}

export const bedrockAgent = new BedrockAgentService();
