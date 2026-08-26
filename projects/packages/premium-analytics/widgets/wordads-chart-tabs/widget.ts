/**
 * External dependencies
 */
import {
	createReportParamsField,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/fields';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The widget owns its date range and bucket size, because the Ads section's
 * other widgets read `wordads/earnings`, which takes no date parameters — so
 * the section offers no header date control for this one to follow.
 */
export type WordAdsChartTabsAttributes = Partial< ReportParamsFieldAttributes >;

/*
 * `relevance: 'high'` puts the control in the widget's own header, where the
 * host measures it and collapses it into a dropdown when the card is too
 * narrow. `WidgetRoot` already prefers `attributes.reportParams` over the URL,
 * so the control and the chart read one source with no further wiring.
 */
const ReportParamsField = createReportParamsField( { withIntervalControl: true } );

/**
 * Widget type definition.
 *
 * Renders ads served, average CPM, and revenue as selectable metric tabs over a
 * line chart. Which metric is plotted is the chart's own tab selection.
 * Requires WordAds to be active on the site.
 */
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
	// Stored as a preset alone so `normalizeReportParams` recomputes its moving
	// end on every load, rather than baking the dates this module was built on.
	example: {
		attributes: {
			reportParams: { preset: 'last-30-days', interval: 'day' },
		},
	},
};
