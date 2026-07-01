/**
 * Given a country code, return a flag SVG URL from CDN.
 * @param countryCode - A two-letter ISO 3166-1 country code (lowercase)
 * @return Flag SVG URL
 */
export function flagUrl( countryCode: string ): string | null {
	if ( ! countryCode || countryCode.length !== 2 ) {
		return null;
	}

	// Use jsDelivr CDN to serve flag-icons package SVGs
	return `https://cdn.jsdelivr.net/npm/flag-icons@7.5.0/flags/4x3/${ countryCode.toLowerCase() }.svg`;
}
