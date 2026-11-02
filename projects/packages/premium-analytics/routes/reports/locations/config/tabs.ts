/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import {
	getLocationsSectionLabel,
	type LocationsReportSection,
} from '@jetpack-premium-analytics/widgets-toolkit';

export type ReportLocationsTabId = LocationsReportSection;

const DEFAULT_TAB_ID: ReportLocationsTabId = 'countries';

const reportLocationsTabs = defineReportTabs< ReportLocationsTabId >(
	[
		{
			id: 'countries',
			getLabel: () => getLocationsSectionLabel( 'countries' ),
		},
		{
			id: 'regions',
			getLabel: () => getLocationsSectionLabel( 'regions' ),
		},
		{
			id: 'cities',
			getLabel: () => getLocationsSectionLabel( 'cities' ),
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
