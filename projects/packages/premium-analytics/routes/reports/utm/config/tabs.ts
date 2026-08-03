/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';

/**
 * Stable URL section identifiers for the UTM report's parameter selector.
 */
export type UtmReportTabId =
	| 'source-medium'
	| 'campaign-source-medium'
	| 'source'
	| 'medium'
	| 'campaign';

const DEFAULT_TAB_ID: UtmReportTabId = 'source-medium';

const reportUtmTabs = defineReportTabs< UtmReportTabId >(
	[
		{
			id: 'source-medium',
			getLabel: () => __( 'Source / Medium', 'jetpack-premium-analytics-pkg' ),
		},
		{
			id: 'campaign-source-medium',
			getLabel: () => __( 'Campaign / Source / Medium', 'jetpack-premium-analytics-pkg' ),
		},
		{ id: 'source', getLabel: () => __( 'Source', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'medium', getLabel: () => __( 'Medium', 'jetpack-premium-analytics-pkg' ) },
		{ id: 'campaign', getLabel: () => __( 'Campaign', 'jetpack-premium-analytics-pkg' ) },
	],
	DEFAULT_TAB_ID
);

const UTM_PARAMS: Record< UtmReportTabId, StatsUtmParam > = {
	'source-medium': 'utm_source,utm_medium',
	'campaign-source-medium': 'utm_campaign,utm_source,utm_medium',
	source: 'utm_source',
	medium: 'utm_medium',
	campaign: 'utm_campaign',
};

/** Build the ordered, translated report tabs. */
export const getReportUtmTabs = reportUtmTabs.getTabs;

/** Get the translated dimension label for a report tab. */
export const getUtmTabLabel = reportUtmTabs.getTabLabel;

/** Resolve an arbitrary URL section to a supported UTM report tab. */
export const resolveSection = reportUtmTabs.resolve;

/**
 * Map a report tab to the UTM endpoint's parameter dimension.
 *
 * @param tab - The active report tab.
 * @return The matching UTM endpoint parameter.
 */
export function getUtmParam( tab: UtmReportTabId ): StatsUtmParam {
	return UTM_PARAMS[ tab ];
}
