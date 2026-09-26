/**
 * External dependencies
 */
import { defineReportTabs } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';

export type EarningsReportTabId = 'wordads' | 'sponsored' | 'adjustments';

/** The `wordads/earnings` bucket each tab reports on. */
export const EARNINGS_BUCKETS = {
	wordads: 'wordads',
	sponsored: 'sponsored',
	adjustments: 'adjustment',
} as const;

export const DEFAULT_TAB_ID: EarningsReportTabId = 'wordads';

const earningsReportTabs = defineReportTabs< EarningsReportTabId >(
	[
		{
			id: 'wordads',
			getLabel: () => __( 'Earnings history', 'jetpack-premium-analytics-pkg' ),
			getTitle: () => __( 'Earnings history report', 'jetpack-premium-analytics-pkg' ),
		},
		{
			id: 'sponsored',
			getLabel: () => __( 'Sponsored content history', 'jetpack-premium-analytics-pkg' ),
			getTitle: () => __( 'Sponsored content history report', 'jetpack-premium-analytics-pkg' ),
		},
		{
			id: 'adjustments',
			getLabel: () => __( 'Adjustments history', 'jetpack-premium-analytics-pkg' ),
			getTitle: () => __( 'Adjustments history report', 'jetpack-premium-analytics-pkg' ),
		},
	],
	DEFAULT_TAB_ID
);

/** Ordered tab IDs. */
export const EARNINGS_TAB_IDS = earningsReportTabs.ids;

/**
 * Build the ordered, translated Earnings report tabs.
 */
export const getEarningsReportTabs = earningsReportTabs.getTabs;

/**
 * Resolve a raw section value to an Earnings report tab.
 */
export const resolveSection = earningsReportTabs.resolve;

/** Heading for the active tab's section. */
export const getTabTitle = earningsReportTabs.getTabTitle;
