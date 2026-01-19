/**
 * Application-wide constants
 */

/**
 * Reserved subdomains that cannot be used for landing pages
 * These are protected system subdomains and common infrastructure names
 */
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'studio',
  'cdn',
  'static',
  'assets',
  'files',
  'mail',
  'email',
  'smtp',
  'pop',
  'imap',
  'ftp',
  'sftp',
  'ssh',
  'vpn',
  'blog',
  'shop',
  'store',
  'support',
  'help',
  'docs',
  'status',
  'staging',
  'dev',
  'test',
  'demo',
];

/**
 * DNS-safe subdomain regex
 * - Start with letter or digit
 * - Can contain letters, digits, hyphens
 * - End with letter or digit
 * - Length: 1-63 characters
 */
export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

/**
 * Throttle configuration for publish operations
 */
export const THROTTLE_CONFIG = {
  WINDOW_MS: 15_000, // 15 seconds
  CLEANUP_MS: 60_000, // Clean up after 1 minute
} as const;
