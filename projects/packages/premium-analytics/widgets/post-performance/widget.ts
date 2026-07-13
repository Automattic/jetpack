/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Granularity the chart can be grouped by within the dashboard range.
 */
export type PostPerformanceGranularity = 'day' | 'week' | 'month';

/**
 * Configurable attributes for the Performance widget. The post scope and
 * report params reach it through WidgetRoot: the detail page seeds
 * `post_id` into the URL, and the dashboard date picker owns the range.
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `day`.
 */
export type PostPerformanceAttributes = {
	granularity?: PostPerformanceGranularity;
};

/**
 * Widget type definition.
 *
 * The post detail Traffic view's Performance card, per the new design spec:
 * headline Views / Comments / Likes for the scoped post over a comparative
 * view-trend line chart. Merges the legacy Calypso post summary chart
 * (`stats-post-summary`) with the highlights metrics. The view series comes
 * from the `stats/post/{id}` daily history; comments and likes are lifetime
 * totals (the endpoint has no per-post series for them), so those tabs render
 * value-only. The `granularity` attribute (`relevance: 'high'`) chooses the
 * bucket size within the dashboard range.
 */
export default {
	name: 'jpa/post-performance',
	title: __( 'Performance', 'jetpack-premium-analytics' ),
	description: __(
		'Views, comments, and likes for the post or page being viewed, with the view trend over the selected period.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'By days', 'jetpack-premium-analytics' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< PostPerformanceAttributes >[],
	example: {
		attributes: {
			granularity: 'day',
		},
	},
};
