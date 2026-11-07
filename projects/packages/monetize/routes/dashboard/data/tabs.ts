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
];

const SETTINGS_TAB: Tab = {
	value: 'settings',
	label: () => __( 'Settings', 'jetpack-monetize' ),
};

/**
 * The page's tabs: Settings joins them only where the Ads settings live on this page.
 *
 * @param hasAdsSettings - Whether the server sent the Settings tab's data.
 * @return The tabs, in order.
 */
export function getTabs( hasAdsSettings: boolean ): Tab[] {
	return hasAdsSettings ? [ ...TABS, SETTINGS_TAB ] : TABS;
}

/**
 * The tab a `?tab=` value names, falling back to Overview.
 *
 * @param value - The `tab` search param.
 * @param tabs  - The tabs the page shows.
 * @return The tab.
 */
export function getTab( value: unknown, tabs: Tab[] = TABS ): Tab {
	return tabs.find( tab => tab.value === value ) ?? tabs[ 0 ];
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
