import Razorpay from 'razorpay';

export const LIVE_RAZORPAY_KEY_ID = 'rzp_live_TtbxpyiMKn1eoh';
export const LIVE_RAZORPAY_KEY_SECRET = 'wKZZSpE4HlsQEJ7eCvEURYRq';

export function getPublicRazorpayKeyId(): string {
  let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || LIVE_RAZORPAY_KEY_ID;
  // If running in production (or on docstudio.docdril.com) and test key was configured by mistake, use verified live credentials
  if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
    keyId = LIVE_RAZORPAY_KEY_ID;
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  let keySecret = process.env.RAZORPAY_KEY_SECRET || LIVE_RAZORPAY_KEY_SECRET;
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || LIVE_RAZORPAY_KEY_ID;
  if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
    keySecret = LIVE_RAZORPAY_KEY_SECRET;
  }
  return keySecret;
}

export function getRazorpayClient(): Razorpay {
  const keyId = getPublicRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}
