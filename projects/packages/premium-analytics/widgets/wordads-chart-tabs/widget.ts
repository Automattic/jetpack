/**
 * External dependencies
 */
import {
	reportParamsAttributeField,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { DEFAULT_REPORT_PARAMS } from './default-report-params';
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
	icon: chartBar,
	attributes: [
		reportParamsAttributeField< WordAdsChartTabsAttributes >( { grain: WORDADS_GRAIN } ),
		chartTypeAttributeField(),
	] as WidgetAttributeField< WordAdsChartTabsAttributes >[],
	example: {
		attributes: {
			reportParams: DEFAULT_REPORT_PARAMS,
			chartType: 'line',
		},
	},
};
