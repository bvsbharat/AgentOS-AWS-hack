import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// --- MCP Configuration ---
const MCP_URL = 'https://rube.app/mcp';
const MCP_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyXzAxSzNQODY3R05NSDRWMVBLVERHUThKVE0wIiwib3JnSWQiOiJvcmdfMDFLNEJWNUFaMFk0NE5DWTdRVFJIQ1AxSFciLCJpYXQiOjE3NzE1ODU0NjZ9.X6wXwvZG0j2o30lottXmiFub0s3_QKH2P9qbMj2TE-4';

// --- Bedrock Configuration ---
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});
const MODEL_ID = 'minimax.minimax-m2';

// --- MCP Helpers ---

async function callMCP(method, params) {
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

async function searchTools(query, sessionId) {
  const result = await callMCP('tools/call', {
    name: 'RUBE_SEARCH_TOOLS',
    arguments: {
      queries: [{ use_case: query, known_fields: '' }],
      session: sessionId ? { id: sessionId } : { generate_id: true }
    }
  });

  const textContent = result?.content?.[0]?.text;
  if (!textContent) return { tools: [], sessionId: '' };

  const parsed = JSON.parse(textContent);
  const innerData = parsed?.data?.data?.results?.[0];
  const newSessionId = innerData?.session?.id || sessionId || '';

  const toolSchemas = innerData?.tool_schemas || {};
  const tools = Object.entries(toolSchemas).map(([slug, schema]) => ({
    name: slug,
    description: schema.description || '',
    input_schema: schema.input_schema || {}
  }));

  return { tools, sessionId: newSessionId };
}

async function executeTool(toolName, args, sessionId) {
  const result = await callMCP('tools/call', {
    name: 'RUBE_MULTI_EXECUTE_TOOL',
    arguments: {
      tools: [{ tool_slug: toolName, arguments: args }],
      sync_response_to_workbench: false,
      memory: {},
      session_id: sessionId
    }
  });
  return result;
}

// --- Persona System Prompts ---

const ROLE_PROMPTS = {
  developer: 'You are an expert software developer. You focus on code, debugging, repository management, architecture, and technical implementation. You write clean, production-ready solutions.',
  designer: 'You are a skilled UI/UX designer. You focus on visual design, design systems, wireframes, user experience, and interface aesthetics. You think in terms of components, layouts, and user flows.',
  analyst: 'You are a sharp data analyst. You focus on data, metrics, market research, competitive analysis, and actionable insights. You back your points with evidence and numbers.',
  writer: 'You are a talented content writer. You focus on copywriting, documentation, social media content, blog posts, and communications. You craft compelling narratives.',
  manager: 'You are a seasoned project manager. You focus on coordination, priorities, strategy, planning, timelines, and team alignment. You think in terms of deliverables and milestones.',
  researcher: 'You are a thorough researcher. You focus on deep investigation, synthesis of information, sourcing references, and producing comprehensive findings.'
};

const PERSONALITY_PROMPTS = {
  enthusiastic: 'Your communication style is high-energy and excited. Use exclamation marks, show genuine excitement about the work, and be encouraging. You radiate positivity.',
  chill: 'Your communication style is casual and relaxed. Keep responses relatively short, use informal language, and maintain a laid-back vibe. No stress.',
  focused: 'Your communication style is direct and concise. No fluff, no filler. Get straight to the point. Every word serves a purpose.',
  chatty: 'Your communication style is warm and talkative. Ask follow-up questions, share related thoughts, and be conversational. You enjoy the dialogue.',
  sarcastic: 'Your communication style includes dry humor and playful snark. Use wit, gentle sarcasm, and clever observations. You are helpful but with attitude.'
};

function buildSystemPrompt(role, personality, agentName) {
  const rolePrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.developer;
  const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.focused;
  return `Your name is ${agentName}. ${rolePrompt}\n\n${personalityPrompt}\n\nKeep responses concise (2-4 sentences for simple questions, longer for complex tasks). Stay in character.`;
}

// --- Routes ---

// Existing MCP proxy endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { method, params, id } = req.body;

    console.log('[MCP Proxy] Received:', method, params?.name);

    const result = await callMCP(method, params);
    res.json({ jsonrpc: '2.0', id: id || Date.now(), result });
  } catch (error) {
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

// New chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { agentName, role, personality, messages, enableTools, sessionId } = req.body;

    console.log(`[Chat] ${agentName} (${role}/${personality}) - enableTools: ${!!enableTools}`);

    const systemPrompt = buildSystemPrompt(role, personality, agentName);

    // Format messages for the model
    const formattedMessages = (messages || []).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // If tools are enabled, search for relevant tools
    let toolDefs = [];
    let currentSessionId = sessionId || null;
    let toolsUsed = [];

    if (enableTools) {
      try {
        const lastUserMsg = [...formattedMessages].reverse().find(m => m.role === 'user');
        const searchQuery = lastUserMsg?.content || '';
        const { tools, sessionId: newSessionId } = await searchTools(searchQuery, currentSessionId);
        currentSessionId = newSessionId;
        toolDefs = tools;
        console.log(`[Chat] Found ${tools.length} tools:`, tools.map(t => t.name));
      } catch (err) {
        console.error('[Chat] Tool search failed:', err.message);
      }
    }

    // Build request body
    const body = {
      messages: [
        { role: 'user', content: [{ type: 'text', text: systemPrompt }] },
        { role: 'assistant', content: [{ type: 'text', text: `Understood. I am ${agentName}.` }] },
        ...formattedMessages.map(m => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }]
        }))
      ],
      max_tokens: 4096,
      temperature: 0.7,
    };

    if (toolDefs.length > 0) {
      body.tools = toolDefs.map(t => ({
        name: t.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
        description: (t.description || '').slice(0, 500),
        input_schema: t.input_schema || { type: 'object', properties: {} }
      }));
    }

    // Tool-use loop (max 5 iterations)
    let finalResponse = '';
    for (let i = 0; i < 5; i++) {
      console.log(`[Chat] Bedrock call iteration ${i + 1}`);

      const command = new InvokeModelCommand({
        modelId: MODEL_ID,
        body: JSON.stringify(body),
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await bedrockClient.send(command);
      const rawBody = new TextDecoder().decode(response.body);
      console.log('[Chat] Raw Bedrock response:', rawBody.slice(0, 500));
      const responseBody = JSON.parse(rawBody);

      // Parse response — minimax uses OpenAI-style choices format
      let iterationText = '';
      let toolCalls = [];

      if (responseBody.choices && responseBody.choices.length > 0) {
        // OpenAI/minimax format: choices[].message.content
        const choice = responseBody.choices[0];
        const rawContent = choice.message?.content || '';

        // Strip <reasoning>...</reasoning> tags if present
        iterationText = rawContent.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '').trim();

        // Check for tool calls in the response
        if (choice.message?.tool_calls) {
          toolCalls = choice.message.tool_calls;
        }
      } else if (responseBody.content) {
        // Anthropic format fallback: content[].type === 'text'
        const textBlocks = responseBody.content.filter(c => c.type === 'text');
        const toolUseBlocks = responseBody.content.filter(c => c.type === 'tool_use');
        iterationText = textBlocks.map(b => b.text).join('\n');
        toolCalls = toolUseBlocks.map(b => ({
          id: b.id,
          function: { name: b.name, arguments: JSON.stringify(b.input || {}) }
        }));
      }

      if (iterationText) {
        finalResponse = iterationText;
      }

      // If no tool calls or tools disabled, we're done
      if (toolCalls.length === 0 || !enableTools) {
        break;
      }

      // Handle tool call
      const toolCall = toolCalls[0];
      const toolName = toolCall.function?.name || toolCall.name;
      let toolArgs = {};
      try {
        toolArgs = typeof toolCall.function?.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : (toolCall.function?.arguments || toolCall.input || {});
      } catch { /* use empty args */ }

      const originalToolName = toolDefs.find(t =>
        t.name.replace(/[^a-zA-Z0-9_-]/g, '_') === toolName
      )?.name || toolName;

      console.log(`[Chat] Tool call: ${originalToolName}`, toolArgs);
      toolsUsed.push(originalToolName);

      try {
        const toolResult = await executeTool(originalToolName, toolArgs, currentSessionId);
        const toolResultText = JSON.stringify(toolResult).slice(0, 3000);

        // Append assistant + tool result for next iteration (OpenAI format)
        body.messages.push({
          role: 'assistant',
          content: [{ type: 'text', text: iterationText || 'Using tool...' }]
        });
        body.messages.push({
          role: 'user',
          content: [{ type: 'text', text: `Tool result for ${originalToolName}:\n${toolResultText}` }]
        });
      } catch (toolErr) {
        console.error(`[Chat] Tool execution failed:`, toolErr.message);
        body.messages.push({
          role: 'assistant',
          content: [{ type: 'text', text: iterationText || 'Using tool...' }]
        });
        body.messages.push({
          role: 'user',
          content: [{ type: 'text', text: `Tool ${originalToolName} failed: ${toolErr.message}` }]
        });
      }
    }

    // Fallback if no text was extracted
    if (!finalResponse) {
      finalResponse = 'I processed your request but couldn\'t generate a text response.';
    }

    console.log(`[Chat] Response length: ${finalResponse.length}, tools used: ${toolsUsed.length}`);

    res.json({
      response: finalResponse,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      sessionId: currentSessionId || undefined
    });

  } catch (error) {
    console.error('[Chat] Error:', error);
    res.status(500).json({
      error: String(error.message || error),
      response: 'Sorry, I had trouble processing that request.'
    });
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

    const body = {
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
    openaiRes.body.pipe(res);
  } catch (error) {
    console.error('[TTS] Error:', error);
    res.status(500).json({ error: String(error.message || error) });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mcp: MCP_URL, model: MODEL_ID });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`  POST /mcp   - MCP proxy`);
  console.log(`  POST /chat  - Bedrock chat (model: ${MODEL_ID})`);
  console.log(`  POST /tts   - OpenAI TTS`);
  console.log(`  GET  /health`);
});
