/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances:
 * one day of stats, ten posts, all post types. The reference date is
 * deliberately absent — it is computed at render time so the widget always
 * shows "today" (see top-posts.tsx).
 */
export default {
	name: 'jpa/stats-top-posts',
	title: 'Top posts & pages',
	icon: chartBar,
	presentation: 'framed',
	attributes: [
		{
			id: 'period',
			label: 'Period',
			type: 'text',
		},
		{
			id: 'date',
			label: 'Date',
			type: 'text',
		},
		{
			id: 'num',
			label: 'Number of results',
			type: 'integer',
		},
	],
	example: {
		attributes: {
			period: 'day',
			num: 10,
		},
	},
};
