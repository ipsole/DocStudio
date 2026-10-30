import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check edge headers (Cloudflare, Vercel, standard proxies)
    const cfCountry = request.headers.get('cf-ipcountry');
    const cfCity = request.headers.get('cf-ipcity');
    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelCountry = request.headers.get('x-vercel-ip-country');

    if (vercelCity && vercelCountry) {
      return NextResponse.json({
        location: `${decodeURIComponent(vercelCity)}, ${vercelCountry}`,
      });
    }

    if (cfCity && cfCountry) {
      return NextResponse.json({
        location: `${cfCity}, ${cfCountry}`,
      });
    }

    // Check forwarded IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // If local development IP
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.json({
        ip,
        location: 'Local Workspace (Connected)',
      });
    }

    // Try a fast, non-blocking IP lookup with short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://ipwho.is/${ip}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'DocStudio-Session-Service' },
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.city && data.country_code) {
          return NextResponse.json({
            ip,
            location: `${data.city}, ${data.country_code}`,
          });
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      ip,
      location: 'Online Session',
    });
  } catch {
    return NextResponse.json({
      location: 'Active Session',
    });
  }
}
