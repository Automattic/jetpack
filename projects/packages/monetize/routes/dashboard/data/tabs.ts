import { __ } from '@wordpress/i18n';

export type TabValue = 'overview' | 'payments' | 'subscribers' | 'ads' | 'settings';

interface Tab {
	value: TabValue;
	label: () => string;
}

// Labels are functions so they translate after the init module loads the catalogs.
export const TABS: Tab[] = [
	{
		value: 'overview',
		label: () => __( 'Overview', 'jetpack-monetize' ),
	},
	{
		value: 'payments',
		label: () => __( 'Payments', 'jetpack-monetize' ),
	},
	{
		value: 'subscribers',
		label: () => __( 'Paid subscribers', 'jetpack-monetize' ),
	},
	{
		value: 'ads',
		label: () => __( 'Ads', 'jetpack-monetize' ),
	},
	{
		value: 'settings',
		label: () => __( 'Settings', 'jetpack-monetize' ),
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
