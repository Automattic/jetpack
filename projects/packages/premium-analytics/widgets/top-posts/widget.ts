/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Top posts & pages widget. Mirrors the
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
	 * Which top-pages source to display.
	 */
	contentType?: 'posts-pages' | 'archive';
	/**
	 * Post type(s) to keep. When undefined or empty, posts and pages are shown.
	 *
	 * @deprecated Use `contentType`. Kept so existing widget instances that
	 * filtered to posts or pages continue to render as saved.
	 */
	postType?: string | string[];
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: ten
 * rows, posts and pages. The date range comes from the dashboard picker.
 */
export default {
	name: 'jpa/stats-top-posts',
	title: __( 'Top pages by views', 'jetpack-premium-analytics' ),
	icon: chartBar,
	attributes: [
		{
			id: 'num',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
		{
			id: 'contentType',
			label: __( 'View by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Posts & Pages', 'jetpack-premium-analytics' ),
					value: 'posts-pages',
				},
				{
					label: __( 'Archive', 'jetpack-premium-analytics' ),
					value: 'archive',
				},
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPostsAttributes >[],
	example: {
		attributes: {
			num: 10,
			contentType: 'posts-pages',
		},
	},
};
