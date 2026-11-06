/**
 * External dependencies
 */
import {
	type ChartDisplayChartType,
	reportParamsAttributeField,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { defaultReportParams } from './default-report-params';
import { WORDADS_GRAIN } from './grain';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The widget owns its date control because other Ads widgets accept no dates.
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type WordAdsChartTabsAttributes = Partial< ReportParamsFieldAttributes > & {
	chartType?: ChartDisplayChartType;
};

/**
 * WordAds metric tabs with a widget-owned date control. Requires active WordAds.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page); the tab labels and order match it. The bucket
 * size follows the selected window, so the date field offers the window alone.
 */
export default {
	attributes: [
		reportParamsAttributeField< WordAdsChartTabsAttributes >( {
			grain: WORDADS_GRAIN,
			offersComparison: false,
		} ),
	] as WidgetAttributeField< WordAdsChartTabsAttributes >[],
	example: {
		// A getter: the host reads it on every render, and the default can change after load.
		get attributes() {
			return { reportParams: defaultReportParams(), chartType: 'line' };
		},
	},
};
