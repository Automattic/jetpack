/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
	MetricTileGridSkeleton,
	summaryCount,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { comment, page, people, seen } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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

// Report params arrive from the host but change nothing here: the all-time
// summary query takes no date params.
type AllTimeStatsRenderAttributes = AllTimeStatsAttributes & Partial< ReportParamsFieldAttributes >;
type AllTimeStatsWidgetProps = WidgetRenderProps< AllTimeStatsRenderAttributes >;

/**
 * Dynamic WPCOM keys, whose values arrive numeric or as numeric strings.
 */
type StatsSummary = Record< string, unknown >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Render-only icon per metric; the id doubles as the summary field the tile reads.
 */
const TILE_CONFIG: Record< AllTimeStatsMetricId, { icon: typeof seen } > = {
	views: { icon: seen },
	visitors: { icon: people },
	posts: { icon: page },
	comments: { icon: comment },
};

type AllTimeStatsTile = {
	key: AllTimeStatsMetricId;
	label: string;
	icon: typeof seen;
	value: number;
};

function AllTimeStatsReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	const tiles = useMemo(
		() =>
			ALL_TIME_STATS_METRICS.map( ( { id, label } ): AllTimeStatsTile => ( {
				key: id,
				label,
				icon: TILE_CONFIG[ id ].icon,
				value: summaryCount( summary, id ) ?? 0,
			} ) ),
		[ summary ]
	);

	// The states share the `.root` body wrapper so sizing (and the widget-picker
	// aspect-ratio) stays consistent whether data, a spinner, or a message shows.
	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `placeholderData` keeps the last totals on screen, so a transient
				// refetch failure should not replace them with an error.
				isError={ ! summary && isError }
				error={ {
					description: __(
						"We couldn't load all-time stats. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTileGridSkeleton tiles={ tiles.length } /> }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

/**
 * Ported from the Jetpack Stats "All-time stats" card.
 */
export default function AllTimeStats( { attributes = {} }: AllTimeStatsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport />
		</WidgetRoot>
	);
}
