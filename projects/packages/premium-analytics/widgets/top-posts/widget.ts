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
	 * Maximum number of posts to display.
	 */
	num?: number;
	/**
	 * Post type(s) to keep. When undefined or empty, all types are shown.
	 */
	postType?: string | string[];
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: ten
 * posts, all post types. The date range comes from the dashboard picker.
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
			id: 'postType',
			label: __( 'Post type', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{ label: __( 'All', 'jetpack-premium-analytics' ), value: '' },
				{ label: __( 'Posts', 'jetpack-premium-analytics' ), value: 'post' },
				{ label: __( 'Pages', 'jetpack-premium-analytics' ), value: 'page' },
			],
		},
	] as WidgetAttributeField< TopPostsAttributes >[],
	example: {
		attributes: {
			num: 10,
		},
	},
};
