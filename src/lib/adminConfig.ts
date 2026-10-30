/**
 * Admin Configuration for DocStudio
 * Dedicated Super Administrator: izackstudio1@gmail.com
 */

export const SUPER_ADMIN_EMAIL = 'izackstudio1@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
