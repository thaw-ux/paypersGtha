import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { LineWebhookHandler } from '@/lib/line/handler';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim();
    const signature = req.headers.get('x-line-signature');
    const rawBody = await req.text();

    if (channelSecret && signature) {
      const hash = crypto
        .createHmac('sha256', channelSecret)
        .update(Buffer.from(rawBody, 'utf8'))
        .digest('base64');

      if (hash !== signature) {
        console.warn('Signature mismatch:', { received: signature, calculated: hash });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    let body: any = {};
    try {
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      body = {};
    }

    const events = body.events || [];

    // Process events asynchronously
    if (events.length > 0) {
      await LineWebhookHandler.handleEvents(events);
    }

    return NextResponse.json({ status: 'success', count: events.length }, { status: 200 });
  } catch (error: any) {
    console.error('Error in LINE Webhook Route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'Paypers LINE Webhook',
    timestamp: new Date().toISOString(),
  });
}
