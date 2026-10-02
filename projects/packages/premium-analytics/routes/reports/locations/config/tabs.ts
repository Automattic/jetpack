/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import {
	supportsLocationsCountryFilter,
	type LocationsReportSection,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';

export type ReportLocationsTabId = LocationsReportSection;

const DEFAULT_TAB_ID: ReportLocationsTabId = 'countries';

const reportLocationsTabs = defineReportTabs< ReportLocationsTabId >(
	[
		{
			id: 'countries',
			getLabel: () => __( 'Countries', 'jetpack-premium-analytics-pkg' ),
		},
		{
			id: 'regions',
			getLabel: () => __( 'Regions', 'jetpack-premium-analytics-pkg' ),
		},
		{
			id: 'cities',
			getLabel: () => __( 'Cities', 'jetpack-premium-analytics-pkg' ),
		},
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

/** Get the translated label for a tab, which also heads its section. */
export const getTabLabel = reportLocationsTabs.getTabLabel;

/** Whether a tab can be scoped to a single country. */
export const supportsCountryFilter = supportsLocationsCountryFilter;
