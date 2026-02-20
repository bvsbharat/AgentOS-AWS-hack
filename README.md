# 🤖 AgentOS: The AI-Powered Multi-Agent Workspace

> **Transforming how teams collaborate with AI** — A immersive 3D virtual office where intelligent agents autonomously execute tasks, discover tools, and collaborate in real-time.

## Problem Statement

**The Challenge:** Modern teams struggle with AI integration complexity:
- 🔴 No unified interface for managing multiple AI agents
- 🔴 Limited visibility into agent reasoning and tool usage
- 🔴 Fragmented workflows across different AI tools and services
- 🔴 Difficult to simulate, test, and scale AI-driven processes
- 🔴 Lack of human-in-the-loop oversight for AI task execution
- 🔴 Poor visibility into real-time AI work progress and activity

Teams waste time context-switching between tools, debugging agent failures, and manually coordinating AI workflows. There's no central command center for AI-powered work.

## Why AgentOS?

**The Solution:** AgentOS is a revolutionary **AI team simulation and automation platform** that:

✅ **Visualizes AI Work** — Watch intelligent agents in a 3D virtual office, see exactly what they're doing in real-time
✅ **Enables Tool Discovery** — Agents autonomously discover and execute the right tools via MCP (Model Context Protocol)
✅ **Streamlines Collaboration** — Task-based workflows with automatic agent assignment and progress tracking
✅ **Provides Voice I/O** — Speak to agents, receive voice responses with personality-driven voices
✅ **Integrates Everything** — GitHub, Twitter/X, Slack, web search, Notion, and 100+ more tools via MCP
✅ **Offers Real-Time Insights** — Activity logs, tool step tracking, and automatic Slack notifications
✅ **Enables Startup Automation** — Generate and execute entire task lists from a single startup idea

### The Vision

AgentOS **democratizes AI team management**. Whether you're:
- 🚀 Launching a startup and need virtual team members to execute tasks
- 🏢 Automating enterprise workflows with AI agents
- 🧪 Testing and demoing AI capabilities in an interactive environment
- 📚 Learning how multi-agent AI systems work

AgentOS provides the **unified command center** you need.

---

## 🎯 Key Features

### 1. **3D Virtual Office Environment**
- Immersive Three.js powered visualization
- 5 interactive rooms (Dev Room, Design Studio, Research Lab, Meeting Room, Break Room)
- Customizable agent characters ("Clawbot") with accessories
- Day/night cycle with dynamic lighting
- Smooth agent movement, animation, and interaction
- Drag-to-move agents, click-to-select for details

### 2. **Multi-Agent AI System**
- **5 Pre-Configured Agents** with unique personalities:
  - **Sparky** (Developer) — Enthusiastic, code-focused
  - **Pixel** (Designer) — Chill, design-oriented
  - **Data** (Analyst) — Focused, data-driven
  - **Chirp** (Writer) — Chatty, content creation
  - **Bolt** (Manager) — Sarcastic, coordinating
- Role-based prompting for specialized expertise
- Personality-driven communication styles
- Mood and energy dynamics that affect visual feedback
- Auto-wandering behavior with random interactions

### 3. **Task Management & Execution**
- **Full Task Lifecycle**: Pending → In Progress → Review → Completed
- Kanban-style TaskBoard with drag-and-drop support
- Auto-assignment of tasks to available agents
- Real-time progress tracking with visual indicators
- Structured task result capture and logging
- Automatic Slack notifications on task completion
- Task priority levels (low, medium, high)

### 4. **Autonomous Tool Discovery & Execution**
- Agents dynamically discover tools via **RUBE MCP** (100+ integrated tools)
- Real-time tool execution with streaming results
- Tool categories:
  - 🔍 **Web Search** (Exa, Google)
  - 📝 **Documentation** (Notion, GitHub)
  - 💬 **Communication** (Slack)
  - 🐦 **Social Media** (Twitter/X)
  - 📊 **Data & Analytics**
  - And many more...
- Complete tool step tracking and activity logging
- Error handling and recovery

### 5. **Startup Task Generator**
- **Pre-Built Templates**: Vibe Designer Tool, Code Assistant Pro, etc.
- **Custom Generation**: Input a startup idea → AI breaks it into executable tasks
- Auto-populates TaskBoard with structured tasks
- Ready for immediate execution

### 6. **Voice Interaction**
- **STT (Speech-to-Text)**: Record and send voice messages to agents
- **TTS (Text-to-Speech)**: Agents respond via voice with personality-specific voices
- Role-based voice selection (echo, nova, onyx, etc.)
- Real-time transcription via OpenAI Whisper

### 7. **Real-Time Activity Logging**
- 50-entry activity feed of all agent actions
- Tool step details (success/error, execution time, results)
- Agent movement and status changes
- Direct chat and system events
- Exportable for audit trails

### 8. **All-Hands Meeting Mode**
- Gather all agents in the meeting room for coordination
- Visual indicator: "📢 All Hands Mode Active"
- Useful for group task reviews and announcements

### 9. **External Integrations**
- **GitHub OAuth** — Agents can access repositories and create issues
- **Twitter/X OAuth** — Agents can post and analyze tweets
- **Slack Integration** — Automatic task completion notifications
- **Web Search** — Real-time information discovery
- **Notion** — Documentation and knowledge management
- All via **MCP (Model Context Protocol)** for seamless tool integration

### 10. **Agent Analytics & Mood System**
- **Mood Tracking**: 0-100 scale, affects visual appearance
- **Energy Decay**: Busy agents lose energy; available agents recharge
- **Visual Feedback**: Status rings (green/yellow/red/gray), animations
- **Performance Metrics**: Task completion rates, tool usage, efficiency

---

## 🏗️ Architecture

### Frontend Stack
- **React 18** + TypeScript
- **Zustand** for global state management
- **React Three Fiber** + Three.js for 3D visualization
- **Radix UI** + TailwindCSS for responsive UI
- **Framer Motion** for animations
- **Vite** for fast development

### Backend Stack
- **Express.js** — API server
- **LangGraph** — Agentic AI orchestration
- **AWS Bedrock** — Claude Haiku model for AI reasoning
- **Rube MCP** — Tool discovery and execution platform
- **OpenAI API** — STT (Whisper) and TTS services
- **Node.js** runtime

### Integrations
```
Frontend (React + Three.js)
    ↓ HTTP/SSE
Backend (Express + LangGraph)
    ├→ AWS Bedrock (Claude Haiku) for reasoning
    ├→ Rube MCP (100+ tools)
    ├→ OpenAI (TTS/STT)
    └→ Slack (notifications)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- AWS account with Bedrock access (Claude Haiku)
- OpenAI API key for TTS/STT
- Rube MCP token (provided)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bharatbvs/agent-kimi.git
   cd agent-kimi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # .env file
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret

   OPENAI_API_KEY=your_openai_key
   SLACK_WEBHOOK_URL=your_slack_webhook  # Optional
   ```

4. **Start the development environment**

   **Terminal 1 — Backend Proxy Server:**
   ```bash
   npm run server
   # Runs on http://localhost:3001
   ```

   **Terminal 2 — Frontend Dev Server:**
   ```bash
   npm run dev
   # Opens http://localhost:5173
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📖 Usage Guide

### Creating Your First Task

1. Click **"+ New Task"** button in the TaskBoard
2. Enter:
   - **Title**: "Research AI trends for 2025"
   - **Description**: "Find and summarize the latest AI industry developments"
   - **Priority**: Select "High"
3. Click **"Create"** → Task appears in 'Pending' column
4. Click **"Assign"** → Choose an available agent (e.g., Data)
5. Click **"Execute"** → Watch the agent work in real-time:
   - Agent finds relevant tools ("Running web search")
   - Executes search queries
   - Synthesizes results
   - Task completes with summary in ActivityLog
   - Slack notification sent (if configured)

### Using Startup Generator

1. Click **"Generate Tasks"** in the UI
2. Choose option:
   - **Template**: Select pre-built (e.g., "Vibe Designer Tool")
   - **Custom Idea**: Enter "I want to build an AI chatbot for customer support"
3. Click **"Generate"** → 5-10 tasks auto-populate the TaskBoard
4. Review and assign to agents, then execute

### Talking to Agents

1. Click on any agent in the 3D office
2. **AgentSidebar** opens on the right
3. Type in chat box and press Enter
4. Agent responds using `/chat` endpoint (no tools)
5. Click 🎤 **Microphone** to speak → Agent listens and responds via TTS

### All-Hands Meeting

1. Click **"All Hands"** in the TopBar
2. All agents move to the Meeting Room
3. Coordinate group announcements or reviews
4. Click **"All Hands"** again to dismiss

### Connecting GitHub & Twitter

1. Click **"⚙️ Settings"** → **"Connections"**
2. **GitHub**: Click "Connect" → OAuth popup → Authorize
3. **Twitter**: Same flow
4. Status shows "Connected" when complete
5. Agents can now use GitHub/Twitter tools in tasks

### Monitoring Activity

- **TaskBoard**: Visual progress on all tasks (Kanban columns)
- **ActivityLog**: 50-entry feed of real-time agent actions and tool executions
- **Agent Sidebar**: Selected agent's chat history and current mood/energy

---

## 🔧 Configuration

### Model Selection

Edit `server/proxy.ts`:
```typescript
// Currently uses Claude Haiku for fast, budget-friendly reasoning
const MODEL_ID = 'global.anthropic.claude-haiku-4-5-20251001-v1:0';

// Can switch to Claude Opus for more advanced reasoning:
// const MODEL_ID = 'anthropic.claude-opus-v1';
```

### Agent Customization

Edit `src/store/agentStore.ts` to modify:
- Agent names, roles, and personalities
- Room layouts and desk positions
- Agent colors and accessories
- Skill sets and expertise areas
- Behavior parameters (movement speed, mood decay rate, etc.)

### Tool Configuration

Rube MCP platform provides 100+ tools. To use specific tools:

In `server/proxy.ts`, agents can search for tools by category:
- `RUBE_SEARCH_TOOLS("exa search")` → Web search tools
- `RUBE_SEARCH_TOOLS("notion")` → Notion integration tools
- `RUBE_SEARCH_TOOLS("slack")` → Slack tools

### Slack Notifications

Ensure your Rube MCP configuration includes Slack tool setup. Notifications are sent automatically on task completion to the configured channel.

---

## 📊 Data Models

### Agent
```typescript
interface Agent {
  id: string;
  name: string;
  role: 'developer' | 'designer' | 'researcher' | 'writer' | 'analyst' | 'manager';
  personality: 'chill' | 'focused' | 'chatty' | 'sarcastic' | 'enthusiastic';
  status: 'available' | 'busy' | 'deep_focus' | 'sleeping';
  position: { x: number; z: number };
  mood: number; // 0-100
  energy: number; // 0-100
  conversations: Message[];
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string | null;
  status: 'pending' | 'in_progress' | 'review' | 'completed';
  progress: number; // 0-100
  result?: string;
  toolSteps?: ToolStep[];
  priority: 'low' | 'medium' | 'high';
}
```

### Tool Step
```typescript
interface ToolStep {
  id: string;
  toolName: string; // "RUBE_SEARCH_TOOLS", "RUBE_MULTI_EXECUTE_TOOL", etc.
  action: string; // Human-readable action description
  status: 'success' | 'error';
  summary: string; // Tool result summary
  timestamp: number;
}
```

---

## 🎨 3D Visualization

### Camera Controls
- **Zoom**: Scroll wheel
- **Pan**: Right-click drag (or Cmd+click on Mac)
- **Rotate**: Middle-click drag (or hold space + click drag)
- **Arrow Keys**: Pan around the office when no agent is selected

### Rooms

| Room | Color | Purpose | Agents |
|------|-------|---------|--------|
| **Dev Room** | 🔵 Blue | Software development | Sparky |
| **Design Studio** | 🟣 Purple | Creative design | Pixel |
| **Research Lab** | 🟢 Green | Data analysis & research | Data |
| **Meeting Room** | 🟠 Gold | Collaboration & all-hands | All agents gather here |
| **Break Room** | 🩷 Pink | Casual interaction & chat | Chirp |

### Agent Status Indicators
- 🟢 **Green Ring** — Available and ready for tasks
- 🟡 **Yellow Ring** — Busy executing tasks
- 🔴 **Red Ring** — Deep focus mode
- ⚫ **Gray Ring** — Sleeping/inactive

---

## 🚀 Advanced Features

### Task Generation from Ideas

AgentOS can turn high-level ideas into executable task lists:

**Input**: "I want to build a SaaS analytics dashboard"

**Generated Tasks**:
1. Research market demands and competitors
2. Design UI/UX mockups and wireframes
3. Identify key metrics and KPIs
4. Create technical architecture document
5. Set up GitHub repo and project structure
6. Implement authentication system
7. Build database schema and migrations
8. Develop API endpoints for analytics
9. Create frontend dashboard components
10. Deploy staging environment and test

### Real-Time Streaming

Tasks stream results in real-time:
```
Agent receives task
  ↓
Calls RUBE_SEARCH_TOOLS (discovers relevant tools)
  ↓
Gets tool search results back (SSE event)
  ↓
Calls RUBE_MULTI_EXECUTE_TOOL with selected tool
  ↓
Tool executes and returns results (SSE event)
  ↓
Repeat until task is complete
  ↓
Final summary displayed in chat and ActivityLog
```

### Mood & Energy System

Agents have dynamic mood and energy that affect:
- **Visual Appearance**: Color intensity, animation speed
- **Behavior**: Less energy = slower movement
- **Availability**: Very low energy → "sleeping" status
- **Recovery**: Automatically recover when resting

---

## 📈 Performance & Scalability

- **Canvas Rendering**: Optimized at 1-2x device pixel ratio
- **State Management**: Zustand with efficient batching
- **Streaming**: SSE for real-time updates without blocking
- **Tool Execution**: Async with timeout handling (5 min default)
- **Activity Log**: Capped at 50 entries for memory efficiency
- **Backend**: Horizontally scalable with load balancing

---

## 🔒 Security Considerations

- **API Keys**: Store AWS and OpenAI keys in environment variables (not committed)
- **MCP Token**: Should be rotated periodically (currently hardcoded in demo)
- **CORS**: Configured for localhost development; restrict in production
- **OAuth**: GitHub and Twitter connections handled securely via Composio
- **Data Privacy**: No sensitive data stored in localStorage (only agent positions in sessionStorage)

### Production Checklist
- [ ] Move MCP token to environment variables
- [ ] Restrict CORS to your domain only
- [ ] Add authentication for the backend API
- [ ] Enable HTTPS/TLS for all connections
- [ ] Set up rate limiting on tool execution
- [ ] Implement audit logging for compliance
- [ ] Add error tracking and monitoring (Sentry, etc.)

---

## 🐛 Troubleshooting

### Agent Won't Execute Tasks
- Check if AWS Bedrock is accessible and API keys are valid
- Verify MCP token is active (check Rube dashboard)
- Look at backend logs for detailed error messages
- Ensure task description is clear and specific

### 3D Agents Not Rendering
- Verify Three.js and React Three Fiber are installed
- Check browser console for WebGL errors
- Try clearing browser cache
- Ensure GPU acceleration is enabled in browser settings

### Tool Execution Fails
- Check MCP tool availability in Rube dashboard
- Verify tool parameters match expected schema
- Look at ActivityLog for error details
- Some tools may require additional authentication (GitHub, Twitter, etc.)

### Slack Notifications Not Sending
- Verify Slack webhook URL is configured in environment
- Check backend logs for MCP Slack tool errors
- Ensure Slack channel permissions allow bot posting
- Verify MCP Slack tool is available in your Rube account

### Performance Issues
- Reduce number of agents or tasks visible at once
- Disable shadows in 3D rendering (OfficeScene.tsx)
- Clear ActivityLog (max 50 entries helps)
- Close DevTools in browser for better performance

---

## 📚 Project Structure

```
agent-kimi/
├── src/
│   ├── App.tsx                          # Main app orchestrator
│   ├── main.tsx                         # React entry point
│   ├── types/
│   │   └── index.ts                     # TypeScript interfaces
│   ├── services/
│   │   ├── bedrockAgent.ts              # AWS Bedrock integration
│   │   ├── taskExecutor.ts              # Task execution logic
│   │   ├── ttsService.ts                # Text-to-speech
│   │   ├── sttService.ts                # Speech-to-text
│   │   ├── slackNotifier.ts             # Slack notifications
│   │   └── composioService.ts           # OAuth integrations
│   ├── store/
│   │   └── agentStore.ts                # Zustand global state
│   ├── components/
│   │   ├── three/
│   │   │   ├── OfficeScene.tsx          # 3D canvas
│   │   │   ├── ClawbotAgent.tsx         # Agent 3D model
│   │   │   ├── OfficeEnvironment.tsx    # Rooms & furniture
│   │   │   └── Lighting.tsx             # Dynamic lighting
│   │   └── ui/
│   │       ├── TaskBoard.tsx            # Kanban board
│   │       ├── AgentSidebar.tsx         # Agent details & chat
│   │       ├── ActivityLog.tsx          # Event feed
│   │       ├── TopBar.tsx               # Header UI
│   │       ├── StartupGenerator.tsx     # Task generation
│   │       ├── ConnectionManager.tsx    # OAuth setup
│   │       └── [shadcn components]      # Reusable UI
│   └── App.css
├── server/
│   ├── proxy.ts                         # Express backend
│   └── proxy.js                         # Compiled output
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎓 Learning Resources

### Understanding the System

1. **Task Execution**: Read `src/services/taskExecutor.ts` to understand how tasks are broken down
2. **State Management**: Check `src/store/agentStore.ts` for all state operations
3. **3D Rendering**: Explore `src/components/three/OfficeScene.tsx` for Three.js setup
4. **Tool Integration**: See `server/proxy.ts` for LangGraph + MCP integration
5. **UI Components**: Browse `src/components/ui/` for React patterns

### Key Technologies

- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/
- **Zustand**: https://github.com/pmndrs/zustand
- **AWS Bedrock**: https://docs.aws.amazon.com/bedrock/latest/userguide/
- **MCP Protocol**: https://modelcontextprotocol.io/

---

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution
- [ ] Additional agent personalities and voices
- [ ] New room types and office layouts
- [ ] Expanded tool integrations
- [ ] Mobile responsive UI
- [ ] Performance optimizations
- [ ] Additional voice models
- [ ] Custom agent training
- [ ] Task templates and workflows
- [ ] Dashboard analytics and reporting
- [ ] Persistent storage backend

---

## 📝 License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🙋 Support

- **Issues**: Open a GitHub issue for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Email**: Contact team for hackathon-specific questions

---

## 🏆 Hackathon Impact

**How AgentOS Wins**:

🥇 **Innovation**: First unified 3D multi-agent workspace with real-time tool discovery
🥇 **Usability**: Intuitive interface anyone can use without AI expertise
🥇 **Functionality**: Complete task lifecycle from idea to execution to notification
🥇 **Integration**: Seamlessly connects 100+ tools via MCP
🥇 **Visual Appeal**: Stunning 3D office environment with personality-driven agents
🥇 **Scalability**: Proven to handle multiple agents, tasks, and concurrent operations

**Perfect For**:
- Startups automating their workflows
- Enterprises orchestrating AI teams
- Educators teaching AI concepts
- Developers demoing AI capabilities
- Teams exploring AI-driven productivity

---

## 🎉 Roadmap

### Phase 1 (Done)
- ✅ Core 3D office environment
- ✅ Multi-agent system with personalities
- ✅ Task management and execution
- ✅ Tool discovery via MCP
- ✅ Voice I/O (TTS/STT)
- ✅ Slack notifications

### Phase 2 (Planned)
- 🔄 Persistent storage (database)
- 🔄 Custom agent training
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app
- 🔄 Multiplayer collaboration mode

### Phase 3 (Conceptual)
- 💡 Agent marketplace (share & monetize agents)
- 💡 Plugin system for custom tools
- 💡 Video export of agent work
- 💡 A/B testing for task execution
- 💡 Autonomous agent teams without human input

---

**Built with ❤️ for the Hackathon**

*AgentOS: Where AI Teams Come to Life* 🚀
