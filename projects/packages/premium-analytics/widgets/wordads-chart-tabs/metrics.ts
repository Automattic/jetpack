/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { DataFormat } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Identifier persisted in the widget's `metrics` attribute for each selectable
 * tab. Each id doubles as the WordAds response field the tab reads.
 */
export type WordAdsChartMetricId = 'impressions' | 'cpm' | 'revenue';

/**
 * A selectable WordAds metric: the field it reads and an optional per-tab format
 * override (currency for CPM/revenue; Ads Served falls back to the chart's count
 * format).
 */
export type WordAdsChartMetric = {
	id: WordAdsChartMetricId;
	label: string;
	dataFormat?: DataFormat;
};

/**
 * Currency format for the revenue and CPM tabs (WordAds pays in USD).
 */
const CURRENCY_FORMAT: DataFormat = {
	type: 'currency',
	options: { decimals: 2 },
};

/**
 * Canonical metric definitions, in tab display order — the Calypso WordAds
 * page's tab labels and order. Single source for the settings checkboxes and the
 * rendered tabs so the two cannot drift apart.
 */
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

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_WORDADS_CHART_METRICS: WordAdsChartMetricId[] = WORDADS_CHART_METRICS.map(
	metric => metric.id
);
