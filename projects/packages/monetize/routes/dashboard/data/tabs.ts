import { __ } from '@wordpress/i18n';

export type TabValue = 'overview' | 'payments' | 'subscribers' | 'ads';

interface Tab {
	value: TabValue;
	label: () => string;
	/** The section segment of the WordPress.com Monetize URL serving the same screen, or null for its home. */
	calypsoSection: string | null;
}

// Labels are functions so they translate after the init module loads the catalogs.
export const TABS: Tab[] = [
	{
		value: 'overview',
		label: () => __( 'Overview', 'jetpack-monetize' ),
		calypsoSection: null,
	},
	{
		value: 'payments',
		label: () => __( 'Payments', 'jetpack-monetize' ),
		calypsoSection: 'payments',
	},
	{
		value: 'subscribers',
		label: () => __( 'Paid subscribers', 'jetpack-monetize' ),
		calypsoSection: 'paid-subscriptions',
	},
	{
		value: 'ads',
		label: () => __( 'Ads', 'jetpack-monetize' ),
		calypsoSection: 'ads-earnings',
	},
];

/**
 * The tab a `?tab=` value names, falling back to Overview.
 *
 * @param value - The `tab` search param.
 * @return The tab.
 */
export function getTab( value: unknown ): Tab {
	return TABS.find( tab => tab.value === value ) ?? TABS[ 0 ];
}

/**
 * The WordPress.com Monetize URL serving the same screen as a tab.
 *
 * @param tab      - The tab.
 * @param siteSlug - The site's slug, as WordPress.com addresses it: subdirectory slashes are already `::`.
 * @return The URL.
 */
export function getCalypsoUrl( tab: Tab, siteSlug: string ): string {
	return [ 'https://wordpress.com/earn', tab.calypsoSection, siteSlug ]
		.filter( Boolean )
		.join( '/' );
}

/**
 * The search params that open a tab, keeping the rest; Overview is the bare URL.
 *
 * @param prev - The current search params.
 * @param next - The tab to open.
 * @return The new search params.
 */
export function getTabSearch(
	prev: Record< string, unknown >,
	next: string
): Record< string, unknown > {
	return { ...prev, tab: next === 'overview' ? undefined : next };
}
