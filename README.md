# 🧭 Nearby Help Agent Using Mastra and Telex

Find nearby essential services such as **hospitals**, **restaurants**, **fuel stations**, and more — powered by **Mastra** and integrated into **Telex** via the **A2A (Agent-to-Agent) protocol**.

---

## 🚀 Overview

The **Nearby Help Agent** is a location-based AI assistant built using the [Mastra](https://mastra.ai) agent framework.  
It helps users discover nearby services (healthcare, food, fuel, safety) through intelligent querying and integrates seamlessly with [Telex.im](https://telex.im) workflows using the **Mastra A2A protocol**.

---

## ⚙️ Core Features

- 🧠 **Context-aware assistance** — understands and refines location-based queries.
- 📍 **Accurate nearby search** — finds places using a geolocation API.
- 🗺️ **Clickable map links** — results include Google Maps links that open in new tabs.
- ⏱️ **Real-time responses** — fetches live data instantly.
- 🔗 **Telex Integration** — fully A2A-compliant for smooth workflow automation.

---

## 🧩 Architecture

| Component | Description |
|------------|-------------|
| **Agent** | Built with `@mastra/core` and uses the `createTool` helper for nearby searches. |
| **Tool** | Fetches nearby locations (restaurants, hospitals, fuel, etc.) using the user’s query and coordinates. |
| **A2A Route** | Exposes a JSON-RPC 2.0-compliant endpoint for Telex and other A2A-compatible systems. |
| **Workflow Node** | Configured inside Telex to connect directly with the deployed Mastra A2A endpoint. |

---

## 🧱 Project Structure
```
nearby-help-agent/src/mastra
├── agents/
│ └── nearbyHelpAgent.ts
├── routes/
│ └── a2a-agent-route.ts
├── tools/
│ └── geoapifyTool.ts
├── index.ts
└── README.md
```

---

## 🔌 Mastra A2A Endpoint

After deploying your agent to **Mastra Cloud**, it becomes accessible via a unique A2A endpoint.

Example:


https://telex-mastra.mastra.cloud/a2a/agent/nearbyHelpAgent


This endpoint allows Telex (or any A2A-compatible client) to send and receive structured messages from the agent.

---

## 🧠 Telex Workflow Integration

Below is a ready-to-use Telex workflow configuration for your **Nearby Help Agent**.
```json
{
  "active": false,
  "category": "utilities",
  "description": "Find nearby help services like hospitals, restaurants, or fuel stations based on your location.",
  "id": "vXzN9k3LhT2WpA0B",
  "name": "nearby_help_agent",
  "long_description": "You are a helpful location-based assistant designed to find nearby essential services for users. Your main role is to locate and suggest places such as: - Hospitals, clinics, or pharmacies - Restaurants or cafes - Fuel or gas stations - Police stations or emergency offices. When responding: - Always confirm or request the user’s location if not given - Match their needs to the most relevant service type - Return structured results including: • Name of the place • Address • Category • A clickable Google Maps link (open in new tab) - Be concise and conversational.",
  "short_description": "Find nearby essential services like fuel stations, hospitals, or food spots.",
  "nodes": [
    {
      "id": "nearby_help_agent",
      "name": "Nearby Help Agent",
      "parameters": {},
      "position": [800, -100],
      "type": "a2a/mastra-a2a-node",
      "typeVersion": 1,
      "url": "https://enough-slow-london.mastra.cloud/a2a/agent/nearbyHelpAgent"
    }
  ],
  "settings": {
    "executionOrder": "v1"
  }
}
```

----

🧪 Testing the A2A Endpoint

You can test your Mastra A2A route using curl or a tool like Postman.
```
curl -X POST https://telex-mastra.mastra.cloud/a2a/agent/nearbyHelpAgent \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-001",
    "method": "message/send",
    "params": {
      "message": {
        "kind": "message",
        "role": "user",
        "parts": [
        {
            "kind": "text",
            "text": "Find a hospital near Ikeja"
          }
        ],
        "messageId": "msg-001",
        "taskId": "task-001"
      },
      "configuration": {
        "blocking": true
      }
    }
  }'
```
✅ Expected Response:
```
{
  "jsonrpc": "2.0",
  "id": "test-001",
  "result": {
    "status": {
      "state": "completed",
      "message": {
        "role": "agent",
        "parts": [
          {
            "kind": "text",
            "text": "Here are some hospitals near Ikeja: ... (with map links)"
          }
        ]
      }
    },
    "artifacts": [
      {
        "name": "nearbyHelpAgentResponse",
        "parts": [
          { "kind": "text", "text": "Structured list of results..." }
        ]
      }
    ]
  }
}
```
----

## Future Enhancements

⏰ Add a scheduled workflow to send daily nearby updates (e.g., safety alerts, open pharmacies).

🌍 Improve geolocation precision with IP-based detection.

📊 Cache common queries in Redis for faster repeated lookups.

---

## Authors

Osazuwa Ogbebor 

----

## Resources

Mastra Documentation

Telex Platform

A2A Protocol Specification

Mastra x Telex Integration Blog

Built with ❤️ using Mastra + Telex
Empowering smart, interconnected AI agents.
