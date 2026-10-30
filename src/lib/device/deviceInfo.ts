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
  let ua = uaString;
  let navPlatform = '';
  let navUaDataPlatform = '';

  if (typeof window !== 'undefined') {
    if (!ua) ua = navigator.userAgent || '';
    navPlatform = navigator.platform || '';
    const uaData = (navigator as any).userAgentData;
    if (uaData && uaData.platform) {
      navUaDataPlatform = uaData.platform;
    }
  }

  const userAgent = ua || '';

  // 1. Detect OS & Hardware Platform
  let os = 'Unknown OS';
  let deviceName = 'Desktop Device';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  const isIPhone = /iPhone/i.test(userAgent);
  const isIPad =
    /iPad/i.test(userAgent) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 2 && /Macintosh/i.test(userAgent));
  const isMac =
    (/Macintosh|Mac OS X|MacIntel|MacPPC/i.test(userAgent) ||
      /Mac/i.test(navPlatform) ||
      /macOS/i.test(navUaDataPlatform)) &&
    !isIPhone &&
    !isIPad;
  const isAndroid = /Android/i.test(userAgent) || /Android/i.test(navUaDataPlatform);
  const isWindows =
    /Windows|Win32|Win64|WOW64/i.test(userAgent) ||
    /Win/i.test(navPlatform) ||
    /Windows/i.test(navUaDataPlatform);
  const isCrOS = /CrOS/i.test(userAgent);
  const isLinux = (/Linux/i.test(userAgent) || /Linux/i.test(navPlatform)) && !isAndroid && !isCrOS;

  if (isIPhone) {
    os = 'iOS';
    deviceName = 'Apple iPhone';
    deviceType = 'mobile';
  } else if (isIPad) {
    os = 'iPadOS';
    deviceName = 'Apple iPad';
    deviceType = 'tablet';
  } else if (isAndroid) {
    os = 'Android';
    const isTablet = !/Mobile/i.test(userAgent);
    deviceType = isTablet ? 'tablet' : 'mobile';
    deviceName = isTablet ? 'Android Tablet' : 'Android Smartphone';
  } else if (isMac) {
    os = 'macOS';
    deviceName = 'Apple Mac';
    deviceType = 'desktop';
  } else if (isWindows) {
    os = 'Windows';
    deviceName = 'Windows PC';
    deviceType = 'desktop';
  } else if (isCrOS) {
    os = 'ChromeOS';
    deviceName = 'Google Chromebook';
    deviceType = 'desktop';
  } else if (isLinux) {
    os = 'Linux';
    deviceName = 'Linux Workstation';
    deviceType = 'desktop';
  }

  // 2. Detect Browser
  let browser = 'Web Browser';
  let browserShort = '';

  if (/Edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
    browserShort = 'Edge';
  } else if (/OPR\/|Opera/i.test(userAgent)) {
    browser = 'Opera';
    browserShort = 'Opera';
  } else if (/Brave/i.test(userAgent) || (typeof navigator !== 'undefined' && (navigator as any).brave)) {
    browser = 'Brave Browser';
    browserShort = 'Brave';
  } else if (/Chrome\/([0-9]+)/i.test(userAgent)) {
    browser = 'Google Chrome';
    browserShort = 'Chrome';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Apple Safari';
    browserShort = 'Safari';
  } else if (/Firefox\/([0-9]+)/i.test(userAgent)) {
    browser = 'Mozilla Firefox';
    browserShort = 'Firefox';
  }

  const finalTitle = browserShort ? `${deviceName} (${browserShort})` : `${deviceName} (${os})`;

  return {
    deviceName: finalTitle,
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
