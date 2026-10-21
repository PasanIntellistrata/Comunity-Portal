import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getAnnouncements } from "./tools/announcements.js";
import { searchCommunity } from "./tools/search.js";
import { createPost } from "./tools/posts.js";
import { getEvents } from "./tools/events.js";
import { getDocuments } from "./tools/documents.js";
import { answerFaq } from "./tools/faq.js";
import { getUserProfile } from "./tools/users.js";

// Initialize MCP Server
export const mcpServer = new Server({
  name: "community-portal-mcp",
  version: "1.1.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Register all 7 tools
const tools = [
  getAnnouncements,
  searchCommunity,
  createPost,
  getEvents,
  getDocuments,
  answerFaq,
  getUserProfile
];

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find(t => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Tool not found: ${request.params.name}`);
  }
  
  try {
    return await tool.handler(request.params.arguments || {});
  } catch (error) {
    console.error(`Error in tool ${tool.name}:`, error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});

// Global state for SSE connections
export let sseTransport = null;

// Endpoint for external MCP clients (Claude Desktop, etc) to start an SSE connection
export const handleMcpSse = async (req, res) => {
  console.log("New SSE connection established");
  sseTransport = new SSEServerTransport("/mcp/messages", res);
  await mcpServer.connect(sseTransport);
};

// Endpoint for external MCP clients to send messages to the active SSE connection
export const handleMcpMessages = async (req, res) => {
  if (!sseTransport) {
    return res.status(400).send("No active SSE connection");
  }
  await sseTransport.handlePostMessage(req, res);
};

// Optional: Start standard IO transport if run from command line directly
export const startStdio = async () => {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("MCP Server running on stdio");
};
