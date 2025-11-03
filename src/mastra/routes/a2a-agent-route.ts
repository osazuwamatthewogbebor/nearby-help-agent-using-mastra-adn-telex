import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';
import axios from 'axios';

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');

      const body = await c.req.json();
      const { jsonrpc, id: requestId, params } = body;

      // Basic JSON-RPC validation
      if (jsonrpc !== '2.0' || !requestId) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId || null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0" and id is required'
          }
        }, 400);
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32602,
            message: `Agent '${agentId}' not found`
          }
        }, 404);
      }

      const { message, messages, contextId, taskId, metadata } = params || {};
      const responseUrl = metadata?.response_url;

      // Build message list
      let messagesList = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }

      // Convert to Mastra format
      const mastraMessages = messagesList.map((msg) => ({
        role: msg.role,
        content: msg.parts?.map((part) => {
          if (part.kind === 'text') return part.text;
          if (part.kind === 'data') return JSON.stringify(part.data);
          return '';
        }).join('\n') || ''
      }));

      // ✅ Respond immediately (no timeout)
      c.executionCtx.waitUntil(
        processAgentAsync(agent, agentId, mastraMessages, responseUrl, contextId, taskId)
      );

      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: 'processing',
            timestamp: new Date().toISOString(),
            message: {
              role: 'system',
              parts: [{ kind: 'text', text: 'Agent is processing your request...' }],
              kind: 'message'
            }
          }
        }
      });

    } catch (error) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: { details: error.message }
        }
      }, 500);
    }
  }
});

async function processAgentAsync(agent, agentId, mastraMessages, responseUrl, contextId, taskId) {
  try {
    const response = await agent.generate(mastraMessages);
    const agentText = response.text || '';

    // If Slack response_url exists, send update back
    if (responseUrl) {
      await axios.post(responseUrl, {
        response_type: 'in_channel',
        text: agentText
      });
    }

    console.log(`[${agentId}] Completed async processing`);
  } catch (err) {
    if (responseUrl) {
      await axios.post(responseUrl, {
        text: `Error while processing: ${err.message}`
      });
    }
    console.error(`[${agentId}] Async processing failed:`, err);
  }
}
