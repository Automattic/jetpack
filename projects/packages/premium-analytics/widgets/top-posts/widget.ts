/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

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
	presentation: 'framed',
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
	],
	example: {
		attributes: {
			range: 'last-7-days',
			num: 10,
		},
	},
};
