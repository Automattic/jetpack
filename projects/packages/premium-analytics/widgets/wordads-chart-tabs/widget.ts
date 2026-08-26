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

/*
 * High relevance places the control in the widget header, where it collapses
 * on narrow cards. WidgetRoot reads its saved report parameters.
 */
const ReportParamsField = createReportParamsField( { withIntervalControl: true } );

/** WordAds metric tabs with widget-owned date controls. Requires active WordAds. */
export default {
	icon: chartBar,
	attributes: [
		{
			id: 'reportParams',
			label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
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
