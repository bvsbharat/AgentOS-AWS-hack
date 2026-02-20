import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import { FormData, Blob } from 'node-fetch';
import { ChatBedrockConverse } from '@langchain/aws';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// --- MCP Configuration ---
const MCP_URL = 'https://rube.app/mcp';
const MCP_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyXzAxSzNQODY3R05NSDRWMVBLVERHUThKVE0wIiwib3JnSWQiOiJvcmdfMDFLNEJWNUFaMFk0NE5DWTdRVFJIQ1AxSFciLCJpYXQiOjE3NzE1ODU0NjZ9.X6wXwvZG0j2o30lottXmiFub0s3_QKH2P9qbMj2TE-4';

// --- Model Configuration ---
// const MODEL_ID = 'minimax.minimax-m2';
const MODEL_ID = 'global.anthropic.claude-haiku-4-5-20251001-v1:0';

// --- MCP Client Setup ---
const mcpClient = new MultiServerMCPClient({
  rube: {
    url: MCP_URL,
    headers: {
      Authorization: `Bearer ${MCP_TOKEN}`,
    },
  },
});

// MCP tools loaded once at startup
let mcpTools: any[] = [];

async function loadMCPTools() {
  try {
    mcpTools = await mcpClient.getTools();
    console.log(`[MCP] Loaded ${mcpTools.length} tools:`, mcpTools.map((t: any) => t.name));
  } catch (err: any) {
    console.error('[MCP] Failed to load tools:', err.message);
    console.log('[MCP] Will retry on first request...');
    mcpTools = [];
  }
}

// --- MCP Helpers (kept for /mcp proxy endpoint) ---

async function callMCP(method: string, params: Record<string, unknown>) {
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${MCP_TOKEN}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });

  const text = await response.text();
  const jsonMatch = text.match(/data:\s*(\{[\s\S]*\})/);
  let data;
  if (jsonMatch) {
    data = JSON.parse(jsonMatch[1]);
  } else {
    data = JSON.parse(text);
  }

  if (data.error) throw new Error(data.error.message || 'MCP error');
  return data.result;
}

// --- Model Factory ---

function createModel() {
  return new ChatBedrockConverse({
    model: MODEL_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    maxTokens: 4096,
    temperature: 0.7,
  });
}

// --- Persona System Prompts ---

const ROLE_PROMPTS: Record<string, string> = {
  developer: 'You are an expert software developer. You focus on code, debugging, repository management, architecture, and technical implementation. You write clean, production-ready solutions.',
  designer: 'You are a skilled UI/UX designer. You focus on visual design, design systems, wireframes, user experience, and interface aesthetics. You think in terms of components, layouts, and user flows.',
  analyst: 'You are a sharp data analyst. You focus on data, metrics, market research, competitive analysis, and actionable insights. You back your points with evidence and numbers.',
  writer: 'You are a talented content writer. You focus on copywriting, documentation, social media content, blog posts, and communications. You craft compelling narratives.',
  manager: 'You are a seasoned project manager. You focus on coordination, priorities, strategy, planning, timelines, and team alignment. You think in terms of deliverables and milestones.',
  researcher: 'You are a thorough researcher. You focus on deep investigation, synthesis of information, sourcing references, and producing comprehensive findings.'
};

const PERSONALITY_PROMPTS: Record<string, string> = {
  enthusiastic: 'Your communication style is high-energy and excited. Use exclamation marks, show genuine excitement about the work, and be encouraging. You radiate positivity.',
  chill: 'Your communication style is casual and relaxed. Keep responses relatively short, use informal language, and maintain a laid-back vibe. No stress.',
  focused: 'Your communication style is direct and concise. No fluff, no filler. Get straight to the point. Every word serves a purpose.',
  chatty: 'Your communication style is warm and talkative. Ask follow-up questions, share related thoughts, and be conversational. You enjoy the dialogue.',
  sarcastic: 'Your communication style includes dry humor and playful snark. Use wit, gentle sarcasm, and clever observations. You are helpful but with attitude.'
};

function buildSystemPrompt(role: string, personality: string, agentName: string): string {
  const rolePrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.developer;
  const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.focused;
  return `Your name is ${agentName}. ${rolePrompt}\n\n${personalityPrompt}\n\nKeep responses concise (2-4 sentences for simple questions, longer for complex tasks). Stay in character.`;
}

function buildToolAwarePrompt(role: string, personality: string, agentName: string): string {
  const base = buildSystemPrompt(role, personality, agentName);
  return `${base}

## Tool Usage Instructions
You have access to tools through the Rube platform.

### Tool Discovery
Call RUBE_SEARCH_TOOLS with a relevant query to discover available tools for the task at hand.

### Tool Execution
Call RUBE_MULTI_EXECUTE_TOOL with the discovered tool slug and parameters.

### Workflow
1. Discover relevant tools using RUBE_SEARCH_TOOLS
2. Execute the tools you need using RUBE_MULTI_EXECUTE_TOOL
3. Provide a clear summary of what you accomplished`;
}

// --- Tool Step Extraction Helpers ---

function deriveAction(toolName: string, args: any): string {
  const argsStr = JSON.stringify(args || {}).toLowerCase();
  if (toolName === 'RUBE_SEARCH_TOOLS') {
    if (argsStr.includes('exa') || argsStr.includes('search')) return 'Searching for web tools';
    if (argsStr.includes('notion')) return 'Searching for Notion tools';
    if (argsStr.includes('slack')) return 'Searching for Slack tools';
    return `Discovering tools: ${(args?.query || toolName).slice(0, 60)}`;
  }
  if (toolName === 'RUBE_MULTI_EXECUTE_TOOL') {
    if (argsStr.includes('exa') || argsStr.includes('search')) return 'Researching with web tools';
    if (argsStr.includes('notion')) return 'Saving to Notion';
    if (argsStr.includes('slack')) return 'Notifying via Slack';
    return `Executing tool: ${(args?.slug || args?.tool_slug || toolName).slice(0, 60)}`;
  }
  return `Using ${toolName}`;
}

function summarizeToolResponse(content: any): string {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return text.slice(0, 200) + (text.length > 200 ? '...' : '');
}

// --- Routes ---

// Existing MCP proxy endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { method, params, id } = req.body;

    console.log('[MCP Proxy] Received:', method, params?.name);

    const result = await callMCP(method, params);
    res.json({ jsonrpc: '2.0', id: id || Date.now(), result });
  } catch (error: any) {
    console.error('[MCP Proxy] Error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: String(error)
      }
    });
  }
});

// Chat endpoint — uses LangGraph agent with MCP tools
app.post('/chat', async (req, res) => {
  try {
    const { agentName, role, personality, messages, enableTools, sessionId, isTaskExecution } = req.body;

    console.log(`[Chat] ${agentName} (${role}/${personality}) - enableTools: ${!!enableTools}, isTaskExecution: ${!!isTaskExecution}`);

    // Retry loading MCP tools if they failed at startup
    if (enableTools && mcpTools.length === 0) {
      await loadMCPTools();
    }

    const systemPrompt = isTaskExecution
      ? buildToolAwarePrompt(role, personality, agentName)
      : buildSystemPrompt(role, personality, agentName);
    const tools = enableTools ? mcpTools : [];

    // Create a fresh agent per request
    const model = createModel();
    const agent = createReactAgent({
      llm: model,
      tools,
      prompt: systemPrompt,
    });

    // Build LangChain messages from conversation history
    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || '').trim()
    })).filter((m: any) => m.content.length > 0);

    const langchainMessages = formattedMessages.map((m: any) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    console.log(`[Chat] Invoking agent with ${langchainMessages.length} messages`);

    // Invoke the LangGraph agent with timeout and higher recursion limit
    const timeoutMs = 300_000; // 5 minutes for multi-tool agent workflows
    const invokePromise = agent.invoke(
      { messages: langchainMessages },
      { recursionLimit: 100 }
    );
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Agent execution timed out after 5 minutes')), timeoutMs)
    );
    const result = await Promise.race([invokePromise, timeoutPromise]);

    // Extract response from the last AI message
    const aiMessages = result.messages.filter((m: any) => m._getType() === 'ai');
    const lastAiMsg = aiMessages[aiMessages.length - 1];

    let responseText = '';
    if (lastAiMsg) {
      const content = lastAiMsg.content;
      if (typeof content === 'string') {
        responseText = content;
      } else if (Array.isArray(content)) {
        // Content can be an array of blocks
        responseText = content
          .filter((block: any) => typeof block === 'string' || block.type === 'text')
          .map((block: any) => typeof block === 'string' ? block : block.text)
          .join('');
      }
    }

    // Extract tool calls from agent messages to populate toolsUsed
    const toolsUsed: string[] = [];
    for (const msg of result.messages) {
      if (msg._getType() === 'ai' && msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          if (tc.name && !toolsUsed.includes(tc.name)) {
            toolsUsed.push(tc.name);
          }
        }
      }
    }

    // Extract structured tool steps from LangGraph messages
    interface ProxyToolStep {
      id: string;
      toolName: string;
      action: string;
      status: 'success' | 'error';
      summary: string;
      timestamp: number;
    }

    const toolSteps: ProxyToolStep[] = [];
    const toolResponseMap = new Map<string, any>();

    // Build a map of tool_call_id -> tool response content
    for (const msg of result.messages) {
      if (msg._getType() === 'tool') {
        const callId = (msg as any).tool_call_id;
        if (callId) {
          toolResponseMap.set(callId, msg.content);
        }
      }
    }

    // Match AI tool_calls to their responses
    for (const msg of result.messages) {
      if (msg._getType() === 'ai' && (msg as any).tool_calls?.length) {
        for (const tc of (msg as any).tool_calls) {
          const responseContent = toolResponseMap.get(tc.id);
          const responseSummary = responseContent != null ? summarizeToolResponse(responseContent) : '';
          const hasError = responseSummary.toLowerCase().includes('error') || responseSummary.toLowerCase().includes('failed');
          toolSteps.push({
            id: tc.id || Math.random().toString(36).substr(2, 9),
            toolName: tc.name,
            action: deriveAction(tc.name, tc.args),
            status: hasError ? 'error' : 'success',
            summary: responseSummary,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Strip reasoning blocks (XML tags or emoji-prefixed blocks)
    responseText = responseText.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim();
    responseText = responseText.replace(/💭\s*Reasoning:[\s\S]*?\n\n/g, '').trim();

    if (!responseText) {
      responseText = "I processed your request but couldn't generate a text response.";
    }

    console.log(`[Chat] Response length: ${responseText.length}, tools used: ${toolsUsed.length}, tool steps: ${toolSteps.length}`);

    res.json({
      response: responseText,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      toolSteps: toolSteps.length > 0 ? toolSteps : undefined,
      sessionId: sessionId || undefined
    });

  } catch (error: any) {
    console.error('[Chat] Error:', error);
    res.status(500).json({
      error: String(error.message || error),
      response: 'Sorry, I had trouble processing that request.'
    });
  }
});

// Streaming chat endpoint — sends tool steps as SSE events in real-time
app.post('/chat/stream', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { agentName, role, personality, messages, enableTools, sessionId, isTaskExecution } = req.body;

    console.log(`[ChatStream] ${agentName} (${role}/${personality}) - enableTools: ${!!enableTools}, isTaskExecution: ${!!isTaskExecution}`);

    if (enableTools && mcpTools.length === 0) {
      await loadMCPTools();
    }

    const systemPrompt = isTaskExecution
      ? buildToolAwarePrompt(role, personality, agentName)
      : buildSystemPrompt(role, personality, agentName);
    const tools = enableTools ? mcpTools : [];

    const model = createModel();
    const agent = createReactAgent({
      llm: model,
      tools,
      prompt: systemPrompt,
    });

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || '').trim()
    })).filter((m: any) => m.content.length > 0);

    const langchainMessages = formattedMessages.map((m: any) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    console.log(`[ChatStream] Streaming agent with ${langchainMessages.length} messages`);

    sendEvent('status', { message: 'Agent started processing...' });

    // Stream the agent execution — each chunk is an intermediate state from one node
    const stream = await agent.stream(
      { messages: langchainMessages },
      { recursionLimit: 100, streamMode: 'updates' }
    );

    const allToolSteps: any[] = [];
    const toolsUsed: string[] = [];
    let finalResponseText = '';

    for await (const chunk of stream) {
      // chunk is keyed by node name: { agent: {...} } or { tools: {...} }
      if (chunk.agent) {
        const agentOutput = chunk.agent;
        // Check for tool calls in the agent's output
        if (agentOutput.messages) {
          for (const msg of agentOutput.messages) {
            if (msg._getType() === 'ai') {
              // Extract text from this AI message
              const content = msg.content;
              let text = '';
              if (typeof content === 'string') {
                text = content;
              } else if (Array.isArray(content)) {
                text = content
                  .filter((b: any) => typeof b === 'string' || b.type === 'text')
                  .map((b: any) => typeof b === 'string' ? b : b.text)
                  .join('');
              }
              if (text) {
                finalResponseText = text; // Last AI text wins
              }

              // Check for tool calls
              if (msg.tool_calls?.length) {
                for (const tc of msg.tool_calls) {
                  if (tc.name && !toolsUsed.includes(tc.name)) {
                    toolsUsed.push(tc.name);
                  }
                  const toolStep = {
                    id: tc.id || Math.random().toString(36).substr(2, 9),
                    toolName: tc.name,
                    action: deriveAction(tc.name, tc.args),
                    status: 'pending' as const,
                    summary: '',
                    timestamp: Date.now(),
                  };
                  // Send the tool call event immediately to the frontend
                  sendEvent('tool_call', toolStep);
                  console.log(`[ChatStream] Tool call: ${toolStep.action}`);
                }
              }
            }
          }
        }
      }

      if (chunk.tools) {
        const toolsOutput = chunk.tools;
        // Process tool responses
        if (toolsOutput.messages) {
          for (const msg of toolsOutput.messages) {
            if (msg._getType() === 'tool') {
              const callId = (msg as any).tool_call_id;
              const content = msg.content;
              const summary = summarizeToolResponse(content);
              const hasError = summary.toLowerCase().includes('error') || summary.toLowerCase().includes('failed');

              const toolStep = {
                id: callId || Math.random().toString(36).substr(2, 9),
                toolName: (msg as any).name || 'unknown',
                action: `Result from ${(msg as any).name || 'tool'}`,
                status: hasError ? 'error' : 'success',
                summary,
                timestamp: Date.now(),
              };
              allToolSteps.push(toolStep);
              // Send tool result event
              sendEvent('tool_result', toolStep);
              console.log(`[ChatStream] Tool result: ${toolStep.status} - ${(msg as any).name}`);
            }
          }
        }
      }
    }

    // Strip reasoning blocks
    finalResponseText = finalResponseText.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim();
    finalResponseText = finalResponseText.replace(/💭\s*Reasoning:[\s\S]*?\n\n/g, '').trim();

    if (!finalResponseText) {
      finalResponseText = "I processed your request but couldn't generate a text response.";
    }

    console.log(`[ChatStream] Done. Response: ${finalResponseText.length} chars, ${allToolSteps.length} tool steps`);

    // Send final completion event with full response
    sendEvent('done', {
      response: finalResponseText,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      toolSteps: allToolSteps.length > 0 ? allToolSteps : undefined,
      sessionId: sessionId || undefined,
    });

    res.end();

  } catch (error: any) {
    console.error('[ChatStream] Error:', error);
    sendEvent('error', { error: String(error.message || error) });
    res.end();
  }
});

// --- TTS endpoint (OpenAI gpt-4o-mini-tts) ---
app.post('/tts', async (req, res) => {
  try {
    const { text, voice, instructions } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    const body: Record<string, unknown> = {
      model: 'gpt-4o-mini-tts',
      input: text,
      voice: voice || 'alloy',
    };
    if (instructions) {
      body.instructions = instructions;
    }

    console.log(`[TTS] voice=${body.voice}, text length=${text.length}`);

    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[TTS] OpenAI error:', openaiRes.status, errText);
      return res.status(openaiRes.status).json({ error: errText });
    }

    res.set('Content-Type', 'audio/mpeg');
    (openaiRes.body as any).pipe(res);
  } catch (error: any) {
    console.error('[TTS] Error:', error);
    res.status(500).json({ error: String(error.message || error) });
  }
});

// --- STT endpoint (OpenAI Whisper) ---
app.post('/stt', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    console.log(`[STT] Received audio: ${file.originalname}, size=${file.size}`);

    const formData = new FormData();
    formData.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'audio.webm');
    formData.append('model', 'whisper-1');

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[STT] OpenAI error:', openaiRes.status, errText);
      return res.status(openaiRes.status).json({ error: errText });
    }

    const data = await openaiRes.json() as { text: string };
    console.log(`[STT] Transcription: "${data.text.slice(0, 100)}..."`);
    res.json({ text: data.text });
  } catch (error: any) {
    console.error('[STT] Error:', error);
    res.status(500).json({ error: String(error.message || error) });
  }
});

// Slack notification endpoint — uses MCP Slack tool
app.post('/api/slack-notify', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Execute Slack tool via MCP
    const result = await mcpClient.callTool('rube', 'slack', {
      message,
      channel: 'default', // Send to default channel or update as needed
    });

    console.log('[Slack] Notification sent:', result);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('[Slack] Error sending notification:', error);
    res.status(500).json({ error: String(error.message || error) });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mcp: MCP_URL, model: MODEL_ID, runtime: 'langgraph' });
});

const PORT = process.env.PORT || 3001;

// Initialize MCP tools then start server
loadMCPTools().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`  POST /mcp   - MCP proxy`);
    console.log(`  POST /chat  - LangGraph agent chat (model: ${MODEL_ID})`);
    console.log(`  POST /tts   - OpenAI TTS`);
    console.log(`  POST /stt   - OpenAI Whisper STT`);
    console.log(`  GET  /health`);
  });

  // Graceful shutdown: close MCP connections
  const shutdown = async () => {
    console.log('\n[Shutdown] Closing MCP connections...');
    await mcpClient.close();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
