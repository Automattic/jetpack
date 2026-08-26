/**
 * External dependencies
 */
import {
	createReportParamsField,
	getDefaultReportParams,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** The widget owns its date controls because other Ads widgets accept no dates. */
export type WordAdsChartTabsAttributes = Partial< ReportParamsFieldAttributes >;

// The chart's body is bucketed by the interval, so the control offers it.
const ReportParamsField = createReportParamsField( { withIntervalControl: true } );

/**
 * WordAds metric tabs with widget-owned date controls. Requires active WordAds.
 *
 * Ported from the Jetpack Stats `wordads-chart-tabs` card in wp-calypso (the
 * chart above the WordAds page); the tab labels and order match it.
 */
export default {
	icon: chartBar,
	attributes: [
		{
			id: 'reportParams',
			label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
			// High relevance so the host renders it in the widget's header, where
			// it collapses into a dropdown on narrow cards.
			relevance: 'high',
			Edit: ReportParamsField,
		},
	] as WidgetAttributeField< WordAdsChartTabsAttributes >[],
	example: {
		attributes: {
			reportParams: getDefaultReportParams(),
		},
	},
};
