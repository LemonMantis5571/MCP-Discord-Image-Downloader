import { Client, TextChannel, Message } from 'discord.js';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { DownloadArgs, DownloadMetadata, DownloadResult } from '../../types';
import { ensureDir } from '../../utils/fileUitls';
import { createWriteStream } from 'node:fs';
import type { Attachment } from 'discord.js';

export async function downloadChannelImages(
  client: Client,
  args: DownloadArgs
): Promise<{ content: { type: string; text: string }[] }> {
  const {
    channel_id,
    output_dir = './downloads',
    limit = 100,
    image_limit, 
    include_metadata = true
  } = args;

  if (!client.user) {
    throw new McpError(ErrorCode.InternalError, 'Discord client not ready');
  }

  try {
    const channel = await client.channels.fetch(channel_id);

    if (!channel) throw new Error(`Channel ${channel_id} not found`);

    if (!channel.isTextBased()) {
      throw new Error(`Channel ${channel_id} is not a text channel`);
    }

    // Only guild channels have permissions
    if ('permissionsFor' in channel && typeof channel.permissionsFor === 'function') {
      const permissions = channel.permissionsFor(client.user.id);
      if (!permissions?.has('ViewChannel') || !permissions?.has('ReadMessageHistory')) {
        throw new Error(
          `Insufficient permissions to read channel ${channel_id}`
        );
      }
    }

    const textChannel = channel as TextChannel;
    const channelDir = path.join(output_dir, `${textChannel.name}_${channel_id}`);
    await ensureDir(channelDir);

    // Fetch messages
    const messages: Message[] = [];
    let lastId: string | undefined;

    while (messages.length < limit) {
      const options: { limit: number; before?: string } = {
        limit: Math.min(100, limit - messages.length)
      };
      if (lastId) options.before = lastId;

      const batch = await textChannel.messages.fetch(options);
      if (batch.size === 0) break;

      messages.push(...batch.values());
      lastId = batch.last()?.id;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    const imageMessages: { attachment: Attachment, message: Message, type: string }[] = [];

    for (const message of messages) {
      for (const attachment of message.attachments.values()) {
        const ext = path.extname(attachment.name || '').toLowerCase();
        if (imageExtensions.includes(ext)) {
          imageMessages.push({ attachment, message, type: 'attachment' });
        }
      }
    }

 
    const imagesToProcess = image_limit 
      ? imageMessages.slice(0, image_limit) 
      : imageMessages;


    let downloaded = 0;
    const results: DownloadResult[] = [];
    const skipped = imageMessages.length - imagesToProcess.length;

    for (const { attachment, message } of imagesToProcess) {
      try {
        const filename = include_metadata
          ? `${new Date(message.createdTimestamp).toISOString().split('T')[0]}_${message.author.username}_${message.id}_${attachment.name}`
          : attachment.name || `unknown_${message.id}`;

        const filepath = path.join(channelDir, filename);
        await downloadFile(attachment.url, filepath);

        results.push({
          filename,
          url: attachment.url,
          size: attachment.size,
          messageId: message.id,
          author: message.author.username,
          timestamp: message.createdTimestamp,
        });

        downloaded++;
      } catch (error) {
        console.error(`Failed to download ${attachment.name}:`, error);
      }
    }

    const metadata: DownloadMetadata = {
      channel: {
        id: channel.id,
        name: textChannel.name,
        type: channel.type,
      },
      downloadInfo: {
        date: new Date().toISOString(),
        totalFound: imageMessages.length,
        downloaded,
        skipped: skipped,
        outputDir: channelDir,
        image_limit_applied: image_limit || null,
      },
      images: results,
    };

    await import('node:fs/promises').then(fs => 
      fs.writeFile(path.join(channelDir, 'metadata.json'), JSON.stringify(metadata, null, 2))
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              channel: textChannel.name,
              messages_scanned: messages.length,
              total_images_found: imageMessages.length,
              downloaded,
              skipped: skipped > 0 ? skipped : undefined,
              outputDir: channelDir,
              image_limit_applied: image_limit || "No limit",
              summary: skipped > 0 
                ? `Downloaded ${downloaded} images, skipped ${skipped} due to image_limit`
                : `Downloaded all ${downloaded} images found`,
              metadata,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    if (error.code === 50001) {
      throw new Error('Bot has no access to the channel');
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new McpError(ErrorCode.InternalError, `Failed to download images: ${msg}`);
  }
}

function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', reject);
    }).on('error', reject);
  });
}