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
 * Which timeline the chart draws for the selected email.
 */
export type EmailTimeSeriesMetric = 'opens' | 'clicks';

/**
 * Chart bucket granularity. The email timeline endpoint reports daily
 * buckets; weeks and months aggregate the daily buckets client-side.
 */
export type EmailTimeSeriesGranularity = 'day' | 'week' | 'month';

/**
 * Configurable attributes for the Email performance widget.
 */
export type EmailTimeSeriesAttributes = {
	/**
	 * Which timeline to draw: opens (default) or clicks. The post detail page
	 * pins one per email tab, so the attribute stays at the default (low)
	 * relevance rather than growing a header control.
	 */
	metric?: EmailTimeSeriesMetric;
	/**
	 * Chart bucket granularity (`relevance: 'high'`, so the host renders the
	 * control). Defaults to `day`.
	 */
	granularity?: EmailTimeSeriesGranularity;
};

/**
 * Widget type definition.
 *
 * The opens/clicks-over-time chart from the legacy email detail page
 * (`stats-email-chart-tabs`). The email is scoped by the host through
 * `reportParams.post_id` (the shared single-resource "detail page" param);
 * the timeline spans the dashboard date range.
 */
export default {
	icon: envelope,
	attributes: [
		{
			id: 'metric',
			label: __( 'Metric', 'jetpack-premium-analytics' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{ label: __( 'Opens', 'jetpack-premium-analytics' ), value: 'opens' },
				{ label: __( 'Clicks', 'jetpack-premium-analytics' ), value: 'clicks' },
			],
		},
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{ label: __( 'By days', 'jetpack-premium-analytics' ), value: 'day' },
				{ label: __( 'By weeks', 'jetpack-premium-analytics' ), value: 'week' },
				{ label: __( 'By months', 'jetpack-premium-analytics' ), value: 'month' },
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< EmailTimeSeriesAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
			granularity: 'day',
		},
	},
};
