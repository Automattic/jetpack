/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Most viewed widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`. The date range is owned by the
 * dashboard picker and read from report params, not from attributes.
 */
export type TopPostsAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	num?: number;
	/**
	 * Which report the widget shows: published posts and pages (including the
	 * homepage entry, via `skip_archives=1`), or archive pages (taxonomy,
	 * post-type, search, and date archives).
	 */
	contentView?: 'posts' | 'archives';
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Most viewed" card: a leaderboard of the
 * most-viewed posts & pages, switchable to archive pages. The active view is
 * the `contentView` attribute (`relevance: 'high'`), so the widget host
 * renders its control in the frame header.
 *
 * `example.attributes` doubles as the defaults applied to new instances: ten
 * rows, Posts & pages view. The date range comes from the dashboard picker.
 */
export default {
	name: 'jpa/stats-top-posts',
	title: __( 'Most viewed', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Most viewed posts, pages and archive. Learn about what content resonates the most.',
			'jetpack-premium-analytics'
		),
	},
	icon: postList,
	attributes: [
		{
			id: 'num',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'contentView',
			label: __( 'View', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{ label: __( 'Posts & pages', 'jetpack-premium-analytics' ), value: 'posts' },
				{ label: __( 'Archives', 'jetpack-premium-analytics' ), value: 'archives' },
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPostsAttributes >[],
	example: {
		attributes: {
			num: 10,
			contentView: 'posts',
		},
	},
};
