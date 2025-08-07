import { DiscordMCP } from './server.js';

const server = new DiscordMCP();

server.run().catch(console.error);
