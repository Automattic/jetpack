/**
 * Trusted origins for VideoPress postMessage communication.
 */
const VIDEOPRESS_ALLOWED_ORIGINS = [
	'https://videopress.com',
	'https://video.wordpress.com',
] as const;

export type VideoPressOrigin = ( typeof VIDEOPRESS_ALLOWED_ORIGINS )[ number ];

/**
 * Check whether the given origin is a trusted VideoPress origin.
 *
 * @param {string} origin - The origin to check.
 * @return {boolean} Whether the origin is trusted.
 */
export function isAllowedOrigin( origin: string ): origin is VideoPressOrigin {
	return ( VIDEOPRESS_ALLOWED_ORIGINS as readonly string[] ).includes( origin );
}
