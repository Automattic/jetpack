/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which breakdown dimension the widget lists for the selected email.
 *
 * `countries`, `devices`, and `clients` read the email *opens* breakdown; `links`
 * reads the *clicks* breakdown (only clicked links exist), so the view selector
 * also picks the underlying opens/clicks endpoint. See `render.tsx`.
 */
export type EmailBreakdownView = 'countries' | 'devices' | 'clients' | 'links';

/**
 * Configurable attributes for the Email breakdown widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`.
 */
export type EmailBreakdownAttributes = {
	/**
	 * The email (post) ID to break down. The all-time breakdown endpoints are keyed
	 * entirely by this ID, so the widget renders an empty state until one is set.
	 */
	postId?: number;
	/**
	 * Which breakdown dimension to display. Defaults to `countries`.
	 */
	view?: EmailBreakdownView;
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
 * scoped to a single email via the `postId` attribute; the endpoints report over
 * the whole lifetime of the email, so there is no date range or comparison period.
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
			id: 'postId',
			label: __( 'Email ID', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< EmailBreakdownAttributes >[],
	example: {
		attributes: {
			postId: 1234,
			view: 'countries',
			max: 10,
		},
	},
};
