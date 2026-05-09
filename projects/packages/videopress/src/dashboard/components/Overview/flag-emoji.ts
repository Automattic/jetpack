const REGIONAL_INDICATOR_OFFSET = 127_397;

/**
 * Convert an ISO 3166-1 alpha-2 country code (e.g. "US") to the flag
 * emoji formed from its regional-indicator letter pair. Returns an
 * empty string for inputs that aren't two A-Z letters.
 *
 * Ported from `projects/packages/forms/src/dashboard/components/text-with-flag`
 * to avoid a cross-package dependency for a 12-line pure helper.
 *
 * @param countryCode - Two-letter ISO 3166-1 alpha-2 country code.
 * @return Flag emoji, or empty string if the input is invalid.
 */
export function flagEmoji( countryCode: string ): string {
	if ( ! countryCode || countryCode.length !== 2 ) {
		return '';
	}
	const upper = countryCode.toUpperCase();
	if ( ! /^[A-Z]{2}$/.test( upper ) ) {
		return '';
	}
	return String.fromCodePoint(
		upper.charCodeAt( 0 ) + REGIONAL_INDICATOR_OFFSET,
		upper.charCodeAt( 1 ) + REGIONAL_INDICATOR_OFFSET
	);
}
