/**
 * External dependencies
 */
import {
	PRESET_LAST_7_DAYS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_12_MONTHS,
} from '@jetpack-premium-analytics/datetime';
import {
	createReportParamsField,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { DEFAULT_REPORT_PARAMS } from './default-report-params';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** The widget owns its date controls because other Ads widgets accept no dates. */
export type WordAdsChartTabsAttributes = Partial< ReportParamsFieldAttributes >;

/**
 * WordAds is reported to us daily, so a sub-daily window has no finer bucket to
 * plot and its trailing day is empty until the nightly run lands.
 */
const WORDADS_PRESETS = [ PRESET_LAST_7_DAYS, PRESET_LAST_30_DAYS, PRESET_LAST_12_MONTHS ] as const;

// The chart's body is bucketed by the interval, so the control offers it.
const ReportParamsField = createReportParamsField( {
	withIntervalControl: true,
	presetIds: WORDADS_PRESETS,
} );

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
			reportParams: DEFAULT_REPORT_PARAMS,
		},
	},
};
