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
 * Which breakdown dimension the widget lists for the selected email.
 *
 * `countries`, `devices`, and `clients` read the opens or clicks breakdown per
 * the `metric` attribute; `links` always reads the *clicks* breakdown (only
 * clicked links exist). See `use-email-breakdown-rows.ts`.
 */
export type EmailBreakdownView = 'countries' | 'devices' | 'clients' | 'links';

/**
 * Which email metric the dimension views break down, matching the Opens/Clicks
 * tabs of the Calypso email detail page. Ignored by the `links` view.
 */
export type EmailBreakdownMetric = 'opens' | 'clicks';

/**
 * Configurable attributes for the Email breakdown widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`.
 */
export type EmailBreakdownAttributes = {
	/**
	 * Which breakdown dimension to display. Defaults to `countries`.
	 */
	view?: EmailBreakdownView;
	/**
	 * Whether the dimension views show opens or clicks. Defaults to `opens`.
	 */
	metric?: EmailBreakdownMetric;
	/**
	 * Number of rows to show. `0` means as many as the endpoint returns.
	 */
	max?: number;
	/**
	 * Whether the countries view also renders a world map. Used by the wide
	 * Location clicks card in the fixed post-detail composition.
	 */
	showMap?: boolean;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats email detail "breakdown" modules
 * (`stats-email-module`). That family is one module rendered four times — by
 * country, device, email client, and clicked link — so this ships as a single
 * widget with a `view` selector instead of four near-identical widgets. The
 * attributes stay at the default (low) relevance: the post detail page pins
 * each view as its own fixed, page-titled card, so a header control would
 * fight the composition. The breakdown is
 * scoped to a single email by the host through `reportParams.post_id` (the
 * shared single-resource "detail page" param), not by an attribute; the
 * endpoints report over the whole lifetime of the email, so there is no date
 * range or comparison period.
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
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< EmailBreakdownAttributes >[],
	example: {
		attributes: {
			view: 'countries',
			metric: 'opens',
			max: 10,
		},
	},
};
