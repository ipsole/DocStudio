import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  let localIp = 'localhost';

  try {
    const ifaces = os.networkInterfaces();
    for (const dev in ifaces) {
      const list = ifaces[dev];
      if (!list) continue;
      for (const details of list) {
        if (
          details.family === 'IPv4' &&
          !details.internal &&
          (details.address.startsWith('192.168.') ||
            details.address.startsWith('10.') ||
            details.address.startsWith('172.'))
        ) {
          localIp = details.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }
  } catch (err) {
    console.warn('[Host Info API] Error detecting local IP:', err);
  }

  return NextResponse.json({
    localIp,
    localNetworkUrl: `http://${localIp}:3001`,
    localhostUrl: 'http://localhost:3001',
    prodUrl: 'https://docstudio.docdril.com',
  });
}
