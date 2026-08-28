/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Which breakdown dimension the widget lists for the selected email. `links`
 * ignores the `metric` attribute and always reads the clicks breakdown, since
 * only clicked links exist.
 */
export type EmailBreakdownView = 'countries' | 'devices' | 'clients' | 'links';

/**
 * Which email metric the dimension views break down, matching the Opens/Clicks
 * tabs of the Calypso email detail page. Ignored by the `links` view.
 */
export type EmailBreakdownMetric = 'opens' | 'clicks';

/**
 * Configurable attributes for the Email breakdown widget.
 */
export type EmailBreakdownAttributes = {
	view?: EmailBreakdownView;
	metric?: EmailBreakdownMetric;
	/** Set by the wide Location clicks card in the fixed post-detail composition. */
	showMap?: boolean;
};

/**
 * Ported from the Jetpack Stats "breakdown" modules (`stats-email-module`), one
 * module rendered four times via the `view` selector; relevance stays low since
 * the post detail page titles each view, and endpoints are all-time (no date range).
 */
export default {
	icon: envelope,
	attributes: [
		{
			id: 'view',
			label: __( 'Break down by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Countries', 'jetpack-premium-analytics-pkg' ),
					value: 'countries',
				},
				{
					label: __( 'Devices', 'jetpack-premium-analytics-pkg' ),
					value: 'devices',
				},
				{
					label: __( 'Email clients', 'jetpack-premium-analytics-pkg' ),
					value: 'clients',
				},
				{
					label: __( 'Links', 'jetpack-premium-analytics-pkg' ),
					value: 'links',
				},
			],
		},
		{
			id: 'metric',
			label: __( 'Metric', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Opens', 'jetpack-premium-analytics-pkg' ),
					value: 'opens',
				},
				{
					label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
					value: 'clicks',
				},
			],
			// The `links` view always reads the clicks breakdown, so the opens/clicks
			// metric has no effect there — hide the control to keep it from looking live.
			isVisible: ( { view } ) => view !== 'links',
		},
	] as WidgetAttributeField< EmailBreakdownAttributes >[],
	example: {
		attributes: {
			view: 'countries',
			metric: 'opens',
		},
	},
};
