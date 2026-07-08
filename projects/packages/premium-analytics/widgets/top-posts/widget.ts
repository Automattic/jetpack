/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
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
	 * Post type(s) to keep in the Posts & pages view. When undefined or empty,
	 * all types are shown. Has no effect on the Archives view.
	 */
	postType?: string | string[];
	/**
	 * Which report the widget shows: published posts and pages, or archive
	 * pages (home, taxonomy, post-type, search, and date archives).
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
 * rows, all post types, Posts & pages view. The date range comes from the
 * dashboard picker.
 */
export default {
	name: 'jpa/stats-top-posts',
	title: __( 'Most viewed', 'jetpack-premium-analytics' ),
	icon: chartBar,
	attributes: [
		{
			id: 'num',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'postType',
			label: __( 'Post type', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{ label: __( 'All', 'jetpack-premium-analytics' ), value: '' },
				{ label: __( 'Posts', 'jetpack-premium-analytics' ), value: 'post' },
				{ label: __( 'Pages', 'jetpack-premium-analytics' ), value: 'page' },
			],
		},
		{
			id: 'contentView',
			label: __( 'Show', 'jetpack-premium-analytics' ),
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
