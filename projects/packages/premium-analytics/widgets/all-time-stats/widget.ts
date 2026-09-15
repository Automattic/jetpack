/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Lifetime totals the widget shows, in display order. Each id doubles as the
 * summary field the tile reads.
 */
export const ALL_TIME_STATS_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'posts', label: __( 'Posts', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

export type AllTimeStatsMetricId = ( typeof ALL_TIME_STATS_METRICS )[ number ][ 'id' ];

/**
 * No configurable attributes; the empty record allows host-provided fields. A
 * `metrics` subset persisted by an earlier version is ignored.
 */
export type AllTimeStatsAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "All-time stats" card.
 */
export default {
	icon: backup,
	attributes: [] as WidgetAttributeField< AllTimeStatsAttributes >[],
	example: {
		attributes: {},
	},
};
