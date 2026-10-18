/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import {
	getUtmDimensionLabel,
	type UtmReportSection,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Stable URL section identifiers for the UTM report's parameter selector.
 */
export type UtmReportTabId = UtmReportSection;

const DEFAULT_TAB_ID: UtmReportTabId = 'source-medium';

const reportUtmTabs = defineReportTabs< UtmReportTabId >(
	[
		{
			id: 'source-medium',
			getLabel: () => getUtmDimensionLabel( 'source-medium' ),
		},
		{
			id: 'campaign-source-medium',
			getLabel: () => getUtmDimensionLabel( 'campaign-source-medium' ),
		},
		{
			id: 'source',
			getLabel: () => getUtmDimensionLabel( 'source' ),
		},
		{
			id: 'medium',
			getLabel: () => getUtmDimensionLabel( 'medium' ),
		},
		{
			id: 'campaign',
			getLabel: () => getUtmDimensionLabel( 'campaign' ),
		},
	],
	DEFAULT_TAB_ID
);

/** Build the ordered, translated report tabs. */
export const getReportUtmTabs = reportUtmTabs.getTabs;

/** Get the translated dimension label for a report tab, which also heads its section. */
export const getUtmTabLabel = reportUtmTabs.getTabLabel;

/** Resolve an arbitrary URL section to a supported UTM report tab. */
export const resolveSection = reportUtmTabs.resolve;
