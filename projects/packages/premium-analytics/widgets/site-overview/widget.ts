/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes: it shows a fixed set of period
 * metrics (views, visitors, likes, comments). It reads the dashboard date range
 * and comparison state from report params via `useWidgetRootContext()`, not from
 * attributes, so its shape is empty. `Record< never, never >` (not
 * `Record< string, never >`) composes cleanly with the host's injected
 * `reportParams` field in `render.tsx`.
 */
export type SiteOverviewAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Site overview" card: the period's headline
 * traffic and engagement totals with period-over-period comparison.
 */
export default {
	name: 'jpa/site-overview',
	title: __( 'Site overview', 'jetpack-premium-analytics' ),
	description: __(
		'Views, visitors, likes, and comments for the selected period, with period-over-period change.',
		'jetpack-premium-analytics'
	),
	icon: globe,
};
