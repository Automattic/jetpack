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
	metric?: EmailMetric;
};

/**
 * Ported from the Jetpack Stats "Emails" module. The summary endpoint reports
 * across the whole lifetime of the site, so there is no date range or
 * comparison period.
 */
export default {
	icon: envelope,
	attributes: [
		{
			id: 'metric',
			label: __( 'View by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'By open rate', 'jetpack-premium-analytics-pkg' ),
					value: 'opens',
				},
				{
					label: __( 'By click rate', 'jetpack-premium-analytics-pkg' ),
					value: 'clicks',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< EmailsAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
		},
	},
};
