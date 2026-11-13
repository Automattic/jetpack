/**
 * Internal dependencies
 */
import type { ChartDisplayChartType } from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Which timeline the chart draws for the selected email.
 */
export type EmailTimeSeriesMetric = 'opens' | 'clicks';

/**
 * How the timeline is drawn. The alias ties the attribute to the toolkit's
 * own union, which the chart reads.
 */
export type EmailTimeSeriesChartType = ChartDisplayChartType;

/**
 * The buckets the chart's own control offers: hours of the send day, days of the
 * first 30, months of the first 30.
 */
export type EmailTimeSeriesInterval = 'hour' | 'day' | 'month';

/** The bucket drawn when none is saved: the legacy email page's 30 daily ones. */
export const DEFAULT_EMAIL_TIME_SERIES_INTERVAL: EmailTimeSeriesInterval = 'day';

/**
 * Configurable attributes for the Email performance widget.
 */
export type EmailTimeSeriesAttributes = {
	/**
	 * Not a user-facing control: the post detail page pins one per email tab, and
	 * exposing it would let a pinned tab contradict its own title.
	 */
	metric?: EmailTimeSeriesMetric;
	chartType?: EmailTimeSeriesChartType;
	/** The bucket the chart draws, and with it how far past the send it reaches. */
	chartInterval?: EmailTimeSeriesInterval;
};

/**
 * Ported from the legacy email detail page's opens/clicks-over-time chart
 * (`stats-email-chart-tabs`). The host scopes the email through
 * `reportParams.post_id` and starts the report range at the send; the chart's
 * own interval control decides how far past it the timeline reaches.
 */
export default {
	attributes: [
		{
			id: 'chartInterval',
			getValue: ( { item }: { item: EmailTimeSeriesAttributes } ) =>
				item.chartInterval ?? DEFAULT_EMAIL_TIME_SERIES_INTERVAL,
		},
	] as WidgetAttributeField< EmailTimeSeriesAttributes >[],
	example: {
		attributes: {
			metric: 'opens',
			chartType: 'line',
		},
	},
};
