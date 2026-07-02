/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. Report params still reach it
 * through WidgetRoot: the dashboard date range, or `attributes.reportParams`
 * when a host injects them (e.g. Storybook and dashboard previews). The summary
 * itself is all-time, so those params only key the query — they do not scope the
 * totals.
 */
export type AllTimeStatsAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "All-time highlights" card
 * (`client/my-sites/stats/sections/all-time-highlights-section/` in wp-calypso):
 * a grid of lifetime totals — views, visitors, posts, and the site's best day.
 */
export default {
	name: 'jpa/all-time-stats',
	title: __( 'All-time stats', 'jetpack-premium-analytics' ),
	description: __(
		'Show lifetime totals for your site: views, visitors, posts, and your most popular day.',
		'jetpack-premium-analytics'
	),
	icon: trendingUp,
};
