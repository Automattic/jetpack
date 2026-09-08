/**
 * External dependencies
 */
import {
	reportParamsAttributeField,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
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

/** The widget owns its date controls because other Ads widgets accept no dates. */
export type WordAdsChartTabsAttributes = Partial< ReportParamsFieldAttributes >;

/**
 * WordAds metric tabs with widget-owned date controls. Requires active WordAds.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page); the tab labels and order match it.
 */
export default {
	icon: chartBar,
	attributes: [
		// The chart's body is bucketed by the interval, so the control offers it.
		reportParamsAttributeField< WordAdsChartTabsAttributes >( {
			withIntervalControl: true,
			grain: WORDADS_GRAIN,
		} ),
	] as WidgetAttributeField< WordAdsChartTabsAttributes >[],
	example: {
		attributes: {
			reportParams: DEFAULT_REPORT_PARAMS,
		},
	},
};
