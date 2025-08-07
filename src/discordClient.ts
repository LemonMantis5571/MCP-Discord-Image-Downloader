import { Client, GatewayIntentBits } from 'discord.js';
import { logError, logInfo } from './utils/logging.js';

export function createDiscordClient(token: string): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ],
  });

  client.once('ready', () => {
    logInfo(`Discord bot logged in as ${client.user!.tag}`);
  });

  client.login(token).catch(err => logError('Failed to login Discord client', err));

  return client;
}
