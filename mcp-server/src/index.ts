#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTools } from "./tools.js";

const server = new McpServer({
  name: "horkios",
  version: "1.0.0",
});

const tools = getTools();

for (const tool of tools) {
  const schema: Record<string, z.ZodTypeAny> = {};
  for (const [key, val] of Object.entries(tool.inputSchema)) {
    schema[key] = val as z.ZodTypeAny;
  }

  server.tool(
    tool.name,
    tool.description,
    schema,
    async (args: Record<string, unknown>) => {
      try {
        const result = await tool.handler(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );
}

server.resource(
  "config",
  "horkios://config",
  { mimeType: "application/json", description: "HORKIOS platform configuration" },
  async () => {
    const { readConfig } = await import("./contract.js");
    const config = await readConfig();
    return {
      contents: [{ uri: "horkios://config", mimeType: "application/json", text: JSON.stringify(config, null, 2) }],
    };
  }
);

server.resource(
  "campaign",
  "horkios://campaign/{id}",
  { mimeType: "application/json", description: "Full campaign data by ID" },
  async (uri) => {
    const id = parseInt(uri.pathname.split("/").pop() ?? "0");
    const { readCampaign } = await import("./contract.js");
    const c = await readCampaign(id);
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(c, null, 2) }],
    };
  }
);

server.prompt(
  "create-escrow-wizard",
  "Guided campaign creation flow for agents",
  { deal_description: z.string().describe("Description of the KOL deal") },
  ({ deal_description }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `I want to create a HORKIOS escrow campaign for a KOL deal: ${deal_description}\n\nHelp me define the demands, set weights, choose deadlines, and generate an invite secret. Then call the create_campaign tool.`,
      },
    }],
  })
);

server.prompt(
  "review-invite",
  "Review an incoming escrow invitation",
  { campaign_id: z.number().describe("Campaign ID to review") },
  ({ campaign_id }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: `I received an invitation to review escrow campaign #${campaign_id}. Read the demands and help me decide whether to accept or counter-offer.`,
      },
    }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HORKIOS MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
