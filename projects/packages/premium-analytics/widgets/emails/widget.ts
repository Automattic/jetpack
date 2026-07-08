/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which rate the leaderboard displays. Rows stay in newest-first order
 * regardless; this only changes the value shown and the overlay bar width.
 */
export type EmailMetric = 'opens' | 'clicks';

/**
 * Configurable attributes for the Emails widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type EmailsAttributes = {
	/**
	 * Number of emails to show. `0` means as many as the endpoint returns (max 30).
	 */
	max?: number;
	/**
	 * Which rate to display. Defaults to `opens`.
	 */
	metric?: EmailMetric;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Emails" module. Lists the most recently sent
 * emails with their open and click rates. The displayed rate is the `metric`
 * attribute (`relevance: 'high'`), so the widget host renders its control.
 * The summary endpoint reports across the whole lifetime of the site, so
 * there is no date range or comparison period.
 */
export default {
	name: 'jpa/stats-emails',
	title: __( 'Emails', 'jetpack-premium-analytics' ),
	icon: envelope,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'metric',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Open rate', 'jetpack-premium-analytics' ),
					value: 'opens',
				},
				{
					label: __( 'Click rate', 'jetpack-premium-analytics' ),
					value: 'clicks',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< EmailsAttributes >[],
	example: {
		attributes: {
			max: 10,
			metric: 'opens',
		},
	},
};
