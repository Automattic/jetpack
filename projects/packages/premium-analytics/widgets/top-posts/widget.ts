/**
 * External dependencies
 */
import type { PresetType } from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Configurable attributes for the Top posts & pages widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`.
 */
export type TopPostsAttributes = {
	/**
	 * Date-range preset, e.g. `today`, `last-7-days`, `last-30-days`, `last-year`.
	 * Resolved to an absolute window at render time.
	 */
	range?: PresetType;
	num?: number;
	/**
	 * Post type(s) to keep. When undefined or empty, all types are shown.
	 */
	postType?: string | string[];
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: the
 * trailing 7 days, ten posts, all post types. The `range` preset is resolved
 * to an absolute date window at render time (see render.tsx).
 */
export default {
	name: 'jpa/stats-top-posts',
	title: __( 'Top pages by views', 'jetpack-premium-analytics' ),
	icon: chartBar,
	attributes: [
		{
			id: 'range',
			label: __( 'Date range', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{ label: __( 'Today', 'jetpack-premium-analytics' ), value: 'today' },
				{ label: __( 'Last 7 days', 'jetpack-premium-analytics' ), value: 'last-7-days' },
				{ label: __( 'Last 30 days', 'jetpack-premium-analytics' ), value: 'last-30-days' },
				{ label: __( 'Last year', 'jetpack-premium-analytics' ), value: 'last-year' },
			],
		},
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
	],
	example: {
		attributes: {
			range: 'last-7-days',
			num: 10,
		},
	},
};
