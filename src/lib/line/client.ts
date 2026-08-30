import { messagingApi } from '@line/bot-sdk';

const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

export function getLineConfig() {
  return {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  };
}

export function getLineClient(): messagingApi.MessagingApiClient {
  const config = getLineConfig();
  if (!config.channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured in environment variables.');
  }

  return new MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
  });
}

export function getLineBlobClient(): messagingApi.MessagingApiBlobClient {
  const config = getLineConfig();
  if (!config.channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured in environment variables.');
  }

  return new MessagingApiBlobClient({
    channelAccessToken: config.channelAccessToken,
  });
}

/**
 * Fetch image buffer directly from LINE Content API
 */
export async function downloadLineContent(messageId: string): Promise<Buffer> {
  const config = getLineConfig();
  if (!config.channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured in environment variables.');
  }

  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.channelAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download LINE media content: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
