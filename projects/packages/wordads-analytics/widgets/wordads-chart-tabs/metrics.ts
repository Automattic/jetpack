/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { CountLabel, DataFormat } from '@automattic/jetpack-premium-analytics-api';

// Each id doubles as the WordAds response field the tab reads.
export type WordAdsChartMetricId = 'impressions' | 'cpm' | 'revenue';

export type WordAdsChartMetric = {
	id: WordAdsChartMetricId;
	label: string;
	dataFormat?: DataFormat;
	countLabel?: CountLabel;
};

// Currency for revenue/CPM; Ads Served falls back to the chart's count format.
const CURRENCY_FORMAT: DataFormat = { type: 'currency' };

// Canonical metric definitions, in tab order.
export const WORDADS_CHART_METRICS: WordAdsChartMetric[] = [
	{
		id: 'impressions',
		label: __( 'Ads Served', 'jetpack-wordads-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of ads served. */
			_n( '%s Ad Served', '%s Ads Served', count, 'jetpack-wordads-analytics-pkg' ),
	},
	{
		id: 'cpm',
		label: __( 'Average CPM', 'jetpack-wordads-analytics-pkg' ),
		dataFormat: CURRENCY_FORMAT,
	},
	{
		id: 'revenue',
		label: __( 'Revenue', 'jetpack-wordads-analytics-pkg' ),
		dataFormat: CURRENCY_FORMAT,
	},
];
