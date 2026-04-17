import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8081/api/bookings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = new URL(BACKEND_URL);
    
    // Copy all query parameters
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Proxy] POST request body:', body);
    console.log('[API Proxy] Sending to backend:', BACKEND_URL);
    
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[API Proxy] Backend response status:', response.status);
    
    const text = await response.text();
    let data: any;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    
    console.log('[API Proxy] Backend response body:', data);
    
    if (!response.ok) {
      console.error('[API Proxy] Backend returned error:', {
        status: response.status,
        data: data
      });
      
      // Return detailed error information
      return NextResponse.json(data || { error: `Backend error: ${response.status}` }, { status: response.status });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] POST Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = new URL(BACKEND_URL);
    
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Handle null body (for cancel endpoint)
    let body = null;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    console.log('[API Proxy] PATCH to:', url.toString());
    console.log('[API Proxy] PATCH body:', body);

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[API Proxy] PATCH error:', data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API Proxy] PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
