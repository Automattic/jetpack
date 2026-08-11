/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';

export type ReportLocationsTabId = 'countries' | 'regions' | 'cities';

const DEFAULT_TAB_ID: ReportLocationsTabId = 'countries';

const reportLocationsTabs = defineReportTabs< ReportLocationsTabId >(
	[
		{ id: 'countries', getLabel: () => __( 'Countries', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'regions', getLabel: () => __( 'Regions', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'cities', getLabel: () => __( 'Cities', 'jetpack-premium-analytics-pkg' ) },
	],
	DEFAULT_TAB_ID
);

/**
 * Build the ordered, translated Locations report tabs.
 */
export const getReportLocationsTabs = reportLocationsTabs.getTabs;

/**
 * Resolve a raw section value to a Locations report tab.
 */
export const resolveSection = reportLocationsTabs.resolve;

/**
 * Whether a tab can be scoped to a single country.
 *
 * The Countries tab is already the full country list, so it has no filter.
 *
 * @param tab - The active Locations report tab.
 * @return Whether to show the country filter.
 */
export function supportsCountryFilter( tab: ReportLocationsTabId ): boolean {
	return tab !== 'countries';
}
