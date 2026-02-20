import axios from 'axios';

const PROXY_URL = 'http://localhost:3001';

interface ComposioConnection {
  id: string;
  appName: string;
  status: 'active' | 'pending' | 'disconnected';
  accountId?: string;
}

export class ComposioService {
  private apiKey: string;
  private connectedApps: Map<string, ComposioConnection> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_COMPOSIO_API_KEY || '7iqhy48yzd7427rn7w1bf';
  }

  private isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your_composio_api_key';
  }

  async getConnectedApps(): Promise<ComposioConnection[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await axios.get(`${PROXY_URL}/connections`);
      return response.data.results || [];
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  }

  async initiateConnection(appName: string): Promise<{ redirectUrl: string; connectionId: string } | null> {
    if (!this.isConfigured()) {
      console.error('Composio API not configured');
      return null;
    }

    try {
      const response = await axios.post(`${PROXY_URL}/connections/${appName}/initiate`, {});
      
      const connectionData = response.data;
      this.connectedApps.set(appName, {
        id: connectionData.id,
        appName,
        status: 'pending'
      });
      
      return {
        redirectUrl: connectionData.redirectUrl,
        connectionId: connectionData.id
      };
    } catch (error: any) {
      console.error(`Failed to initiate ${appName} connection:`, error.response?.data || error.message);
      return null;
    }
  }

  async checkConnectionStatus(connectionId: string): Promise<ComposioConnection | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await axios.get(`${PROXY_URL}/connections/${connectionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check connection status:', error);
      return null;
    }
  }

  isAppConnected(appName: string): boolean {
    const connection = this.connectedApps.get(appName);
    return connection?.status === 'active';
  }

  // GitHub Operations
  async createGitHubRepo(name: string, description: string, isPrivate: boolean = false): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'API not configured', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/github_create_repo/execute`, {
        name,
        description,
        private: isPrivate,
        auto_init: true
      });
      return response.data;
    } catch (error: any) {
      console.error('GitHub repo creation error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Failed to create repo', mock: true };
    }
  }

  async createGitHubIssue(owner: string, repo: string, title: string, body: string, labels: string[] = []): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'GitHub not connected', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/github_create_issue/execute`, {
        owner,
        repo,
        title,
        body,
        labels
      });
      return response.data;
    } catch (error) {
      console.error('GitHub issue creation error:', error);
      return { success: false, error: 'Failed to create issue', mock: true };
    }
  }

  async pushCodeToRepo(owner: string, repo: string, path: string, content: string, message: string): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'GitHub not connected', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/github_create_or_update_file/execute`, {
        owner,
        repo,
        path,
        message,
        content: btoa(content)
      });
      return response.data;
    } catch (error) {
      console.error('GitHub push error:', error);
      return { success: false, error: 'Failed to push code', mock: true };
    }
  }

  // X.com (Twitter) Operations
  async postTweet(text: string, mediaUrls?: string[]): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'API not configured', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/twitter_create_tweet/execute`, {
        text,
        ...(mediaUrls && { media_urls: mediaUrls })
      });
      return response.data;
    } catch (error) {
      console.error('Tweet posting error:', error);
      return { success: false, error: 'Failed to post tweet', mock: true };
    }
  }

  async scheduleTweet(text: string, scheduledTime: string): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twitter not connected', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/twitter_schedule_tweet/execute`, {
        text,
        scheduled_time: scheduledTime
      });
      return response.data;
    } catch (error) {
      console.error('Tweet scheduling error:', error);
      return { success: false, error: 'Failed to schedule tweet', mock: true };
    }
  }

  async getTwitterAnalytics(tweetId: string): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twitter not connected', mock: true };
    }

    try {
      const response = await axios.get(`${PROXY_URL}/actions/twitter_get_tweet_metrics/execute`, {
        params: { tweet_id: tweetId }
      });
      return response.data;
    } catch (error) {
      console.error('Twitter analytics error:', error);
      return { success: false, error: 'Failed to get analytics', mock: true };
    }
  }

  // Research Operations
  async webSearch(query: string): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'API not configured', mock: true, results: [] };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/exa_search/execute`, {
        query,
        num_results: 10
      });
      return response.data;
    } catch (error) {
      console.error('Web search error:', error);
      return { success: false, error: 'Search failed', mock: true, results: [] };
    }
  }

  async scrapeWebsite(url: string): Promise<any> {
    if (!this.isConfigured()) {
      return { success: false, error: 'API not configured', mock: true };
    }

    try {
      const response = await axios.post(`${PROXY_URL}/actions/firecrawl_scrape/execute`, { url });
      return response.data;
    } catch (error) {
      console.error('Website scraping error:', error);
      return { success: false, error: 'Failed to scrape website', mock: true };
    }
  }
}

export const composioService = new ComposioService();
