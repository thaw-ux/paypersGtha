import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { LineWebhookHandler } from '@/lib/line/handler';

export async function POST(req: NextRequest) {
  try {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
      console.error('LINE_CHANNEL_SECRET is not configured.');
      return NextResponse.json({ error: 'LINE channel secret not set' }, { status: 500 });
    }

    const signature = req.headers.get('x-line-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing x-line-signature' }, { status: 401 });
    }

    const rawBody = await req.text();

    // Verify HMAC-SHA256 signature
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(rawBody)
      .digest('base64');

    if (hash !== signature) {
      console.warn('Invalid LINE signature:', { received: signature, calculated: hash });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const body = JSON.parse(rawBody);
    const events = body.events || [];

    // Process events asynchronously / non-blocking
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
