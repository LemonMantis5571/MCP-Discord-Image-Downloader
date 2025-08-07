import { Attachment, Message } from 'discord.js';

export interface DownloadArgs {
  channel_id: string;
  output_dir?: string;
  limit?: number;
  include_metadata?: boolean;
}

export interface ImageData {
  attachment: Attachment;
  message: Message;
  type: 'attachment';
}

export interface DownloadResult {
  filename: string | undefined;
  url: string | undefined;
  size: number | undefined;
  messageId: string | undefined;
  author: string | undefined;
  timestamp: number| undefined;
}

export interface DownloadMetadata {
  channel: {
    id: string;
    name: string;
    type: number;
  };
  downloadInfo: {
    date: string;
    totalFound: number;
    downloaded: number;
    outputDir: string;
  };
  images: DownloadResult[];
}