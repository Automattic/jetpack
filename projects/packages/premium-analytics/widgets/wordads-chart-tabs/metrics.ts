/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DataFormat } from '@jetpack-premium-analytics/widgets-toolkit';

// Persisted in the `metrics` attribute; each id doubles as the WordAds response
// field the tab reads.
export type WordAdsChartMetricId = 'impressions' | 'cpm' | 'revenue';

export type WordAdsChartMetric = {
	id: WordAdsChartMetricId;
	label: string;
	dataFormat?: DataFormat;
};

// Currency for revenue/CPM; Ads Served falls back to the chart's count format.
const CURRENCY_FORMAT: DataFormat = {
	type: 'currency',
	options: { decimals: 2 },
};

// Single source for the settings checkboxes and the rendered tabs, in tab order.
export const WORDADS_CHART_METRICS: WordAdsChartMetric[] = [
	{ id: 'impressions', label: __( 'Ads Served', 'jetpack-premium-analytics' ) },
	{
		id: 'cpm',
		label: __( 'Average CPM', 'jetpack-premium-analytics' ),
		dataFormat: CURRENCY_FORMAT,
	},
	{
		id: 'revenue',
		label: __( 'Revenue', 'jetpack-premium-analytics' ),
		dataFormat: CURRENCY_FORMAT,
	},
];

// Default for new widget instances: every metric enabled.
export const DEFAULT_WORDADS_CHART_METRICS: WordAdsChartMetricId[] = WORDADS_CHART_METRICS.map(
	metric => metric.id
);
