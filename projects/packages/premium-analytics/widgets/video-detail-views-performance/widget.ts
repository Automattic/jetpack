/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Granularity the chart can be grouped by within the dashboard range.
 */
export type VideoDetailViewsPerformanceGranularity = 'day' | 'week' | 'month';

/**
 * Configurable attributes for the Views performance widget. The video scope
 * and report params reach it through WidgetRoot: the detail page seeds
 * `post_id` into the URL, and the dashboard date picker owns the range.
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `day`.
 */
export type VideoDetailViewsPerformanceAttributes = {
	granularity?: VideoDetailViewsPerformanceGranularity;
};

/**
 * Widget type definition.
 *
 * The video detail page's view-trend card: the scoped video's views over the
 * dashboard date range as a comparative line chart. The series comes from the
 * `stats/video/{id}` daily history, bucketed client-side; the `granularity`
 * attribute (`relevance: 'high'`) chooses the bucket size.
 */
export default {
	icon: seen,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'By days', 'jetpack-premium-analytics-pkg' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics-pkg' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics-pkg' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< VideoDetailViewsPerformanceAttributes >[],
	example: {
		attributes: {
			granularity: 'day',
		},
	},
};
