import { NextRequest, NextResponse } from 'next/server';
import { DriveService } from '@/lib/google/drive.service';

export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { fileId } = params;
    if (!fileId) {
      return new NextResponse('File ID required', { status: 400 });
    }

    const { stream, mimeType } = await DriveService.getFileStream(fileId);

    // Convert readable stream to Web standard ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    console.error('Error proxying Drive file:', error);
    return new NextResponse(error.message || 'File not found', { status: 404 });
  }
}
