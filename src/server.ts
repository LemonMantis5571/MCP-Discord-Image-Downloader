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
import dotenv from 'dotenv';
import path from 'node:path';
import { Client } from 'discord.js';
import { createDiscordClient } from './discordClient.js';
import { downloadChannelImages } from './tools/download/downloadChannelImages.js';
import { DownloadArgs } from './types.js';

import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
            description: 'Download all images from a Discord channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel_id: {
                  type: 'string',
                  description: 'Discord channel ID to download images from',
                },
                output_dir: {
                  type: 'string',
                  description: 'Directory to save images (default: ./downloads)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of messages to fetch (default: 100)',
                },
                include_metadata: {
                  type: 'boolean',
                  description: 'Include message metadata in filenames (default: true)',
                },
              },
              required: ['channel_id'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      if (!this.isReady) {
        throw new McpError(ErrorCode.InternalError, 'Discord client not ready');
      }

      switch (request.params.name) {
        case 'download_channel_images':
          if (!request.params.arguments) {
            throw new Error('Arguments are required for download_channel_images');
          }
          return await downloadChannelImages(this.client, request.params.arguments as unknown as DownloadArgs);
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
