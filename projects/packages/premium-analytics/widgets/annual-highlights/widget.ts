/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';

/**
 * Metric tiles the Annual highlights widget can show.
 */
export type AnnualHighlightMetric = 'posts' | 'words' | 'likes' | 'comments';

/**
 * Configurable attributes for the Annual highlights widget. The widget has no
 * date range — the insights endpoint is not period-scoped.
 */
export type AnnualHighlightsAttributes = {
	/**
	 * Metric tiles to show in the widget body.
	 */
	metrics?: AnnualHighlightMetric[];
};

export const DEFAULT_HIGHLIGHT_METRICS: AnnualHighlightMetric[] = [
	'posts',
	'words',
	'likes',
	'comments',
];

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: every
 * metric enabled.
 */
export default {
	name: 'jpa/annual-highlights',
	title: __( 'Annual highlights', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Your totals for the year at a glance — posts, words, likes, and comments.',
			'jetpack-premium-analytics'
		),
	},
	icon: calendar,
	attributes: [
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: [
				{
					value: 'posts',
					label: __( 'Posts', 'jetpack-premium-analytics' ),
				},
				{
					value: 'words',
					label: __( 'Words', 'jetpack-premium-analytics' ),
				},
				{
					value: 'likes',
					label: __( 'Likes', 'jetpack-premium-analytics' ),
				},
				{
					value: 'comments',
					label: __( 'Comments', 'jetpack-premium-analytics' ),
				},
			],
		},
	] as WidgetAttributeField< AnnualHighlightsAttributes >[],
	example: {
		attributes: {
			metrics: DEFAULT_HIGHLIGHT_METRICS,
		},
	},
};
