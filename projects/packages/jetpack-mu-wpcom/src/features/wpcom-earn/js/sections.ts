export type EarnSection = 'home' | 'payments' | 'paid-subscriptions' | 'ads';

interface SectionRoute {
	/** The wp-build route path, matching the route's package.json. */
	path: string;
	/** The section segment of the matching Calypso URL, or null for the bare `/earn/<site>`. */
	calypsoSection: string | null;
}

// In Calypso's tab order, so the nav reads the same on both.
export const SECTIONS: Record< EarnSection, SectionRoute > = {
	home: { path: '/', calypsoSection: null },
	'paid-subscriptions': { path: '/paid-subscriptions', calypsoSection: 'paid-subscriptions' },
	payments: { path: '/payments', calypsoSection: 'payments' },
	ads: { path: '/ads-earnings', calypsoSection: 'ads-earnings' },
};

/**
 * Whether a value names one of the page's sections.
 *
 * @param value - The value to check.
 * @return Whether it is a section.
 */
export function isEarnSection( value: unknown ): value is EarnSection {
	return typeof value === 'string' && Object.hasOwn( SECTIONS, value );
}

/**
 * The Calypso Earn URL serving the same section.
 *
 * @param section - The section.
 * @param domain  - The site's domain.
 * @return The URL.
 */
export function getCalypsoUrl( section: EarnSection, domain: string ): string {
	const segment = SECTIONS[ section ].calypsoSection;

	return [ 'https://wordpress.com/earn', segment, encodeURIComponent( domain ) ]
		.filter( Boolean )
		.join( '/' );
}
