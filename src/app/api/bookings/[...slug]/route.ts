import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8081/api/bookings';

async function handler(request: NextRequest) {
  try {
    const { pathname, searchParams } = request.nextUrl;
    
    // Extract the dynamic path after /api/bookings
    const pathParts = pathname.split('/api/bookings')[1] || '';
    const fullBackendUrl = BACKEND_URL + pathParts;
    
    console.log('[API Proxy Dynamic] Method:', request.method);
    console.log('[API Proxy Dynamic] Path:', pathParts);
    console.log('[API Proxy Dynamic] Full URL:', fullBackendUrl);
    
    const url = new URL(fullBackendUrl);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    let body = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : null;
        console.log('[API Proxy Dynamic] Request body:', JSON.stringify(body));
      } catch (parseError) {
        console.log('[API Proxy Dynamic] No JSON body or parse error (expected for some endpoints like cancel)');
        body = null;
      }
    }

    const response = await fetch(url.toString(), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log('[API Proxy Dynamic] Backend status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API Proxy Dynamic] Error response:', data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy Dynamic] Error:', error);
    return NextResponse.json({ error: 'Failed to process request', details: String(error) }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
