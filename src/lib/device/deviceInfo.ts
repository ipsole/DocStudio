export interface ClientDeviceInfo {
  sessionId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

const SESSION_STORAGE_KEY = 'docstudio_device_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session';
  }

  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      }
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'ephemeral_' + Math.random().toString(36).substring(2, 10);
  }
}

export function parseUserAgent(uaString?: string): {
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
} {
  const ua = uaString || (typeof window !== 'undefined' ? navigator.userAgent : '');

  // Detect OS
  let os = 'Unknown OS';
  let deviceName = 'Desktop Device';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  if (/iPhone/i.test(ua)) {
    os = 'iOS';
    deviceName = 'Apple iPhone';
    deviceType = 'mobile';
  } else if (/iPad/i.test(ua) || (navigator?.maxTouchPoints > 2 && /Macintosh/i.test(ua))) {
    os = 'iPadOS';
    deviceName = 'Apple iPad';
    deviceType = 'tablet';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
    deviceName = 'Apple Mac';
    deviceType = 'desktop';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
    deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
    deviceName = deviceType === 'tablet' ? 'Android Tablet' : 'Android Device';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
    deviceName = 'Windows PC';
    deviceType = 'desktop';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
    deviceName = 'Linux Workstation';
    deviceType = 'desktop';
  }

  // Detect Browser
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\/([0-9]+)/i.test(ua) && !/Edg/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\/([0-9]+)/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/OPR\//i.test(ua)) {
    browser = 'Opera';
  }

  return {
    deviceName: `${deviceName} (${browser})`,
    deviceType,
    browser,
    os,
  };
}

export function getClientDeviceInfo(): ClientDeviceInfo {
  const sessionId = getOrCreateSessionId();
  const parsed = parseUserAgent();

  return {
    sessionId,
    deviceName: parsed.deviceName,
    deviceType: parsed.deviceType,
    browser: parsed.browser,
    os: parsed.os,
  };
}
