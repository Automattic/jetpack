/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes, and it does not read the
 * dashboard date range: the site summary is all-time, so `useStatsSite()` is
 * queried without report params. Host-injected `attributes.reportParams` still
 * flow into WidgetRoot for parity with the other Stats widgets, but they do not
 * affect what this widget fetches or shows.
 */
export type AllTimeStatsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "All-time stats" card: a labelled list of
 * lifetime totals — views, visitors, posts, and comments.
 */
export default {
	name: 'jpa/all-time-stats',
	title: __( 'All-time stats', 'jetpack-premium-analytics' ),
	description: __(
		'Show lifetime totals for your site: views, visitors, posts, and comments.',
		'jetpack-premium-analytics'
	),
	icon: trendingUp,
};
