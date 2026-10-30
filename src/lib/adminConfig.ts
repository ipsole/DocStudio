/**
 * Admin Configuration for DocStudio
 * Dedicated Super Administrators: izackstudio1@gmail.com, itpiyu@gmail.com
 */

export const SUPER_ADMIN_EMAILS = [
  'izackstudio1@gmail.com',
  'itpiyu@gmail.com',
];

export const SUPER_ADMIN_EMAIL = 'izackstudio1@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.includes(clean);
}
