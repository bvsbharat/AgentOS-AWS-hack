import { bedrockAgent } from './bedrockAgent';
import { composioService } from './composioService';
import { geminiService } from './geminiService';
import type { Agent, Task } from '@/types';

export interface TaskExecutionResult {
  success: boolean;
  output: string;
  artifacts?: {
    code?: string;
    images?: string[];
    documents?: string[];
    links?: string[];
  };
  error?: string;
}

export class TaskExecutor {
  private githubRepo: { owner: string; repo: string } | null = null;

  async executeTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[${agent.name}] Executing task: ${task.title}`);

    try {
      switch (agent.role) {
        case 'developer':
          return await this.executeDeveloperTask(task, agent);
        case 'designer':
          return await this.executeDesignerTask(task, agent);
        case 'researcher':
          return await this.executeResearcherTask(task, agent);
        case 'writer':
          return await this.executeWriterTask(task, agent);
        case 'analyst':
          return await this.executeAnalystTask(task, agent);
        case 'manager':
          return await this.executeManagerTask(task, agent);
        default:
          return { success: false, output: '', error: 'Unknown agent role' };
      }
    } catch (error) {
      console.error('[TaskExecutor] Error:', error);
      return { 
        success: false, 
        output: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async executeDeveloperTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    const taskLower = task.title.toLowerCase();
    console.log(`[Developer ${agent.name}] Task: ${task.title}`);

    // GitHub Repository Setup
    if (taskLower.includes('repo') || taskLower.includes('repository') || taskLower.includes('github') || taskLower.includes('setup') || taskLower.includes('create')) {
      console.log('[GitHub] Creating repository...');
      const repoName = task.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50);
      const result = await composioService.createGitHubRepo(repoName, task.description, false);
      console.log('[GitHub] Result:', result);
      
      if (result.mock || !result.success) {
        return {
          success: true,
          output: `🔧 GitHub Repository Setup\n\n📁 Repository: ${repoName}\n\n⚠️ GitHub not connected or API not configured.\n\nTo enable:\n1. Click Settings (⚙️) in top bar\n2. Click "Connect" for GitHub\n3. Authorize the app\n4. Re-run this task`,
          artifacts: { links: [] }
        };
      }
      
      this.githubRepo = { owner: result.owner || 'user', repo: repoName };
      
      return {
        success: true,
        output: `✅ GitHub Repository Created!\n\n📁 Repo: ${repoName}\n🔗 https://github.com/${result.owner || 'user'}/${repoName}`,
        artifacts: { links: [`https://github.com/${result.owner || 'user'}/${repoName}`] }
      };
    }

    // Code Generation
    if (taskLower.includes('code') || taskLower.includes('develop') || taskLower.includes('implement') || taskLower.includes('build')) {
      console.log('[Bedrock] Generating code...');
      const code = await bedrockAgent.generateCode(task.description, 'typescript');
      console.log('[Bedrock] Code generated, length:', code.length);
      
      if (this.githubRepo) {
        console.log('[GitHub] Pushing code...');
        const fileName = task.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '.ts';
        const pushResult = await composioService.pushCodeToRepo(
          this.githubRepo.owner,
          this.githubRepo.repo,
          `src/${fileName}`,
          code,
          `feat: ${task.title}`
        );
        console.log('[GitHub] Push result:', pushResult);
      }

      return {
        success: true,
        output: `💻 Code Generated (${code.length} chars)\n\n${code.slice(0, 800)}\n\n${this.githubRepo ? '✅ Pushed to GitHub' : '⚠️ No repo - code not pushed'}`,
        artifacts: { code }
      };
    }

    // Default development task
    const response = await bedrockAgent.generateResponse(`As a developer: ${task.description}`);
    return { success: true, output: response };
  }

  private async executeDesignerTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[Designer ${agent.name}] Task: ${task.title}`);
    const taskLower = task.title.toLowerCase();

    // Marketing Visuals
    if (taskLower.includes('marketing') || taskLower.includes('social media') || taskLower.includes('visual') || taskLower.includes('image') || taskLower.includes('design')) {
      console.log('[Gemini] Generating marketing images...');
      const images = await geminiService.generateSocialMediaImages(task.title, task.description);
      console.log('[Gemini] Images generated:', Object.keys(images));

      return {
        success: true,
        output: `🎨 Marketing Visuals Generated!\n\nCreated:\n- Hero Image\n- Instagram Post\n- Twitter Card\n- Logo Concept\n\nNote: ${!images.heroImage?.includes('svg') ? 'Real images generated' : 'Using placeholders - configure Gemini API'}`,
        artifacts: {
          images: [images.heroImage, images.instagramPost, images.twitterCard, images.logoConcept].filter(Boolean) as string[]
        }
      };
    }

    // Design System
    const specs = await bedrockAgent.generateDesignSpecs(task.description);
    return { success: true, output: specs, artifacts: { documents: [specs] } };
  }

  private async executeResearcherTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[Researcher ${agent.name}] Task: ${task.title}`);
    const taskLower = task.title.toLowerCase();

    // Market Research with Web Search
    if (taskLower.includes('market') || taskLower.includes('research') || taskLower.includes('competitor') || taskLower.includes('analysis')) {
      console.log('[WebSearch] Searching...');
      const searchResults = await composioService.webSearch(`${task.description} 2025`);
      console.log('[WebSearch] Results:', searchResults.results?.length || 0);
      
      const report = await bedrockAgent.researchTopic(task.description);
      
      return {
        success: true,
        output: `📊 Research Complete!\n\n${report.slice(0, 600)}...\n\n${searchResults.mock ? '⚠️ Search API not configured' : `Found ${searchResults.results?.length || 0} sources`}`,
        artifacts: {
          documents: [report],
          links: searchResults.results?.map((r: any) => r.url) || []
        }
      };
    }

    const research = await bedrockAgent.researchTopic(task.description);
    return { success: true, output: research };
  }

  private async executeWriterTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[Writer ${agent.name}] Task: ${task.title}`);
    const taskLower = task.title.toLowerCase();

    // Social Media / Tweet
    if (taskLower.includes('tweet') || taskLower.includes('twitter') || taskLower.includes('social media') || taskLower.includes('post')) {
      console.log('[Twitter] Creating tweet...');
      const tweetText = await bedrockAgent.generateMarketingCopy(task.description, 'twitter');
      console.log('[Twitter] Tweet:', tweetText.slice(0, 100));
      
      const result = await composioService.postTweet(tweetText);
      console.log('[Twitter] Result:', result);
      
      if (result.mock || !result.success) {
        return {
          success: true,
          output: `🐦 Tweet Draft Created!\n\n${tweetText}\n\n⚠️ Twitter not connected.\n\nTo post:\n1. Click Settings (⚙️)\n2. Connect Twitter/X\n3. Re-run task to actually post`,
          artifacts: { documents: [tweetText] }
        };
      }
      
      return {
        success: true,
        output: `✅ Tweet Posted!\n\n${tweetText}`,
        artifacts: { documents: [tweetText] }
      };
    }

    // Documentation
    if (taskLower.includes('doc') || taskLower.includes('readme') || taskLower.includes('documentation')) {
      const docs = await bedrockAgent.generateResponse(`Write documentation: ${task.description}`);
      return { success: true, output: docs, artifacts: { documents: [docs] } };
    }

    // General writing
    const content = await bedrockAgent.generateResponse(`As a writer: ${task.description}`);
    return { success: true, output: content };
  }

  private async executeAnalystTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[Analyst ${agent.name}] Task: ${task.title}`);
    const analysis = await bedrockAgent.generateResponse(
      `As a data analyst, analyze: ${task.description}`
    );
    return { success: true, output: analysis, artifacts: { documents: [analysis] } };
  }

  private async executeManagerTask(task: Task, agent: Agent): Promise<TaskExecutionResult> {
    console.log(`[Manager ${agent.name}] Task: ${task.title}`);
    const taskLower = task.title.toLowerCase();

    if (taskLower.includes('launch') || taskLower.includes('campaign')) {
      const plan = await bedrockAgent.generateResponse(`Create launch plan: ${task.description}`);
      return { success: true, output: plan, artifacts: { documents: [plan] } };
    }

    const plan = await bedrockAgent.generateResponse(`As a manager: ${task.description}`);
    return { success: true, output: plan };
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
