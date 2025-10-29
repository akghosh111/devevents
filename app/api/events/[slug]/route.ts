import { NextRequest, NextResponse } from 'next/server';
import { connect } from 'mongoose';
import { Event } from '@/database';

// Database connection helper
async function connectToDatabase(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }
  
  // Check if already connected to avoid multiple connections
  if (global.mongoose?.conn) {
    return;
  }

  await connect(process.env.MONGODB_URI);
}

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * Fetch event details by slug
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Validate slug parameter - await params as it's a Promise in Next.js 15+
    const { slug } = await params;
    
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid slug parameter' },
        { status: 400 }
      );
    }

    // Sanitize slug (remove special characters, allow only alphanumeric and hyphens)
    const sanitizedSlug = slug.trim().toLowerCase();
    const slugPattern = /^[a-z0-9-]+$/;
    
    if (!slugPattern.test(sanitizedSlug)) {
      return NextResponse.json(
        { error: 'Slug contains invalid characters' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Query event by slug
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Return event data
    return NextResponse.json(
      { success: true, data: event },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (use proper logging in production)
    console.error('Error fetching event:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json(
          { error: 'Database configuration error' },
          { status: 500 }
        );
      }

      // Mongoose validation or cast errors
      if (error.name === 'CastError' || error.name === 'ValidationError') {
        return NextResponse.json(
          { error: 'Invalid request parameters' },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
