/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

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
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats email detail "breakdown" modules
 * (`stats-email-module`). That family is one module rendered four times — by
 * country, device, email client, and clicked link — so this ships as a single
 * widget with a `view` selector (`relevance: 'high'`, rendered as a control by
 * the widget host) instead of four near-identical widgets. The breakdown is
 * scoped to a single email by the host through `reportParams.post_id` (the
 * shared single-resource "detail page" param), not by an attribute; the
 * endpoints report over the whole lifetime of the email, so there is no date
 * range or comparison period.
 */
export default {
	name: 'jpa/email-breakdown',
	title: __( 'Email breakdown', 'jetpack-premium-analytics' ),
	icon: envelope,
	attributes: [
		{
			id: 'view',
			label: __( 'Break down by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Countries', 'jetpack-premium-analytics' ),
					value: 'countries',
				},
				{
					label: __( 'Devices', 'jetpack-premium-analytics' ),
					value: 'devices',
				},
				{
					label: __( 'Email clients', 'jetpack-premium-analytics' ),
					value: 'clients',
				},
				{
					label: __( 'Links', 'jetpack-premium-analytics' ),
					value: 'links',
				},
			],
			relevance: 'high',
		},
		{
			id: 'metric',
			label: __( 'Metric', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Opens', 'jetpack-premium-analytics' ),
					value: 'opens',
				},
				{
					label: __( 'Clicks', 'jetpack-premium-analytics' ),
					value: 'clicks',
				},
			],
			// The `links` view always reads the clicks breakdown, so the opens/clicks
			// metric has no effect there — hide the control to keep it from looking live.
			isVisible: ( { view } ) => view !== 'links',
		},
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
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
