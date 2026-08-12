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
import {
	chartTypeAttributeField,
	granularityAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

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
 * How the timeline is drawn. The shared chart-display list keeps every chart
 * widget's dropdown identical and ties it to the toolkit's own union.
 */
export type EmailTimeSeriesChartType = ChartDisplayChartType;

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
	/**
	 * How to draw the timeline (`relevance: 'high'`). Defaults to `line`.
	 */
	chartType?: EmailTimeSeriesChartType;
};

/**
 * Widget type definition.
 *
 * The opens/clicks-over-time chart from the legacy email detail page
 * (`stats-email-chart-tabs`), with the window total as the metric headline.
 * The email is scoped by the host through `reportParams.post_id` (the shared
 * single-resource "detail page" param); the timeline spans the dashboard
 * date range.
 */
export default {
	icon: envelope,
	attributes: [
		{
			id: 'metric',
			label: __( 'Metric', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{ label: __( 'Opens', 'jetpack-premium-analytics-pkg' ), value: 'opens' },
				{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ), value: 'clicks' },
			],
		},
		granularityAttributeField( [ 'day', 'week', 'month' ] ),
		chartTypeAttributeField(),
	] as WidgetAttributeField< EmailTimeSeriesAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
			granularity: 'day',
			chartType: 'line',
		},
	},
};
