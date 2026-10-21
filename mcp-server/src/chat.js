import OpenAI from 'openai';
import { mcpServer } from './mcp.js';
import dotenv from 'dotenv';

dotenv.config();

// The chat orchestrator function
export const handleChat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message && conversationHistory.length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in .env' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Get the list of tools from our own MCP server to pass to OpenAI
    // We simulate an internal MCP list request
    const toolsResponse = await mcpServer.request({ method: 'tools/list' }, z.any().optional());
    
    // Convert MCP tools to OpenAI function definitions
    const openaiTools = toolsResponse.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));

    // Build the messages array
    const messages = [
      { 
        role: "system", 
        content: "You are the AI Assistant for the Intellistrata Community Portal. You are a helpful, polite concierge for residents. You have access to tools to query the community database. Always use tools to look up real information rather than making things up."
      },
      ...conversationHistory
    ];
    
    if (message) {
      messages.push({ role: "user", content: message });
    }

    // Call OpenAI
    let response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: messages,
      tools: openaiTools,
      tool_choice: "auto",
    });

    let responseMessage = response.choices[0].message;

    // Handle tool calls iteratively
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage); // Add the assistant's tool call intent to history
      
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`OpenAI requested tool call: ${functionName}`, functionArgs);
        
        // Execute the tool locally against our MCP server
        try {
          const toolResult = await mcpServer.request({
            method: 'tools/call',
            params: {
              name: functionName,
              arguments: functionArgs
            }
          }, z.any().optional());
          
          // Format the result for OpenAI
          const resultText = toolResult.content.map(c => c.text).join('\n');
          
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: resultText,
          });
        } catch (e) {
          console.error(`Tool execution failed: ${e.message}`);
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: `Error executing tool: ${e.message}`,
          });
        }
      }
      
      // Call OpenAI again with the tool results
      response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: messages,
        tools: openaiTools,
      });
      
      responseMessage = response.choices[0].message;
    }

    // Return the final text response
    return res.json({
      reply: responseMessage.content,
      history: messages // return the full history so the client can keep context
    });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// We need a small mock for Zod as the MCP server request requires a schema parameter type in TS
// Since we are in pure JS and calling our own server instance, we can just pass an empty object
const z = { any: () => ({ optional: () => ({}) }) };
