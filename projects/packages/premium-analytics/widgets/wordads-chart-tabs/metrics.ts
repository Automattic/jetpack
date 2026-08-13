/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DataFormat } from '@jetpack-premium-analytics/widgets-toolkit';

// Each id doubles as the WordAds response field the tab reads.
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

// Canonical metric definitions, in tab order.
export const WORDADS_CHART_METRICS: WordAdsChartMetric[] = [
	{ id: 'impressions', label: __( 'Ads Served', 'jetpack-premium-analytics-pkg' ) },
	{
		id: 'cpm',
		label: __( 'Average CPM', 'jetpack-premium-analytics-pkg' ),
		dataFormat: CURRENCY_FORMAT,
	},
	{
		id: 'revenue',
		label: __( 'Revenue', 'jetpack-premium-analytics-pkg' ),
		dataFormat: CURRENCY_FORMAT,
	},
];
