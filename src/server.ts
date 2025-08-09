import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  CallToolRequest,
  ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'discord.js';
import { createDiscordClient } from './discordClient.js';
import { downloadChannelImages } from './tools/download/downloadChannelImages.js';
import * as z from "zod";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const DEFAULT_DOWNLOADS_DIR = path.resolve(__dirname, '../downloads');


if (!fs.existsSync(DEFAULT_DOWNLOADS_DIR)) {
  fs.mkdirSync(DEFAULT_DOWNLOADS_DIR, { recursive: true });
  console.error(`📁 Created directory: ${DEFAULT_DOWNLOADS_DIR}`);
}


const downloadChannelImagesSchema = z.object({
  channel_id: z.string().describe('Discord channel ID to download images from'),
  output_dir: z.string().optional().default(DEFAULT_DOWNLOADS_DIR),
  message_limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(100)
    .describe('Maximum number of MESSAGES to scan for images. Default: 100 messages'),
  image_limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum number of IMAGES to download. If not set, downloads all images found'),
  include_metadata: z.boolean().optional().default(true),
});

export class DiscordMCP {
  private server: Server;
  private client: Client;
  private isReady = false;

  constructor() {
    this.server = new Server(
      {
        name: 'discord-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN environment variable is required');
    }

    this.client = createDiscordClient(process.env.DISCORD_TOKEN);

    this.client.once('ready', () => {
      this.isReady = true;
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      return {
        tools: [
          {
            name: 'download_channel_images',
             description: `Download all images from a Discord channel.
💡          Tip: For best usability, allow "${DEFAULT_DOWNLOADS_DIR}" in your filesystem MCP or specify your own preferred directory.`,
            inputSchema: z.toJSONSchema(downloadChannelImagesSchema),
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      if (!this.isReady) {
        throw new McpError(ErrorCode.InternalError, 'Discord client not ready');
      }

      switch (request.params.name) {
        case 'download_channel_images': {
          if (!request.params.arguments) {
            throw new Error('Arguments are required for download_channel_images');
          }

      
          const args = downloadChannelImagesSchema.parse(request.params.arguments);

          return await downloadChannelImages(this.client, args);
        }
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Discord MCP server running on stdio');
  }
}
