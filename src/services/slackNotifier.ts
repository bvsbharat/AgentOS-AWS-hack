/**
 * Slack notification service for task completion updates
 */

export interface SlackNotificationPayload {
  taskTitle: string;
  agentName: string;
  status: 'completed' | 'failed';
  output?: string;
  error?: string;
}

export async function notifySlackTaskCompletion(payload: SlackNotificationPayload): Promise<void> {
  try {
    const message = buildSlackMessage(payload);

    // Send to proxy server which will execute Slack tool via MCP
    const response = await fetch('http://localhost:3001/api/slack-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      console.warn('[SlackNotifier] Failed to send Slack notification:', response.statusText);
    }
  } catch (error) {
    console.warn('[SlackNotifier] Error sending Slack notification:', error);
    // Don't throw - notifications are non-critical
  }
}

function buildSlackMessage(payload: SlackNotificationPayload): string {
  const { taskTitle, agentName, status, output, error } = payload;
  const emoji = status === 'completed' ? '✅' : '❌';

  let message = `${emoji} Task ${status.toUpperCase()}\n`;
  message += `Agent: ${agentName}\n`;
  message += `Task: ${taskTitle}\n`;

  if (status === 'completed' && output) {
    message += `Summary: ${output.slice(0, 200)}`;
  } else if (status === 'failed' && error) {
    message += `Error: ${error}`;
  }

  return message;
}
