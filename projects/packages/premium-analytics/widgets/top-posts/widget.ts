/**
 * WordPress dependencies
 */
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
	title: 'Top pages by views',
	icon: chartBar,
	presentation: 'framed',
	attributes: [
		{
			id: 'range',
			label: 'Date range',
			type: 'text',
			elements: [
				{ label: 'Today', value: 'today' },
				{ label: 'Last 7 days', value: 'last-7-days' },
				{ label: 'Last 30 days', value: 'last-30-days' },
				{ label: 'Last year', value: 'last-year' },
			],
		},
		{
			id: 'num',
			label: 'Number of results',
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
