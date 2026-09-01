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
import { comment, people, postContent, seen, trendingUp } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import {
	ALL_TIME_STATS_METRICS,
	DEFAULT_ALL_TIME_STATS_METRICS,
	type AllTimeStatsAttributes,
	type AllTimeStatsMetricId,
} from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
	options: { decimals: 0 },
};

/**
 * Render-only icon per metric; the id doubles as the summary field the tile reads.
 */
const TILE_CONFIG: Record< AllTimeStatsMetricId, { icon: typeof seen } > = {
	views: { icon: seen },
	visitors: { icon: people },
	posts: { icon: postContent },
	comments: { icon: comment },
};

type AllTimeStatsTile = {
	key: AllTimeStatsMetricId;
	label: string;
	icon: typeof seen;
	value: number;
};

function AllTimeStatsReport( {
	metrics = DEFAULT_ALL_TIME_STATS_METRICS,
}: {
	metrics?: AllTimeStatsMetricId[];
} ) {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = ( data as { stats?: StatsSummary } | undefined )?.stats;

	// Resolve selected ids against the canonical definitions so the tile order
	// stays stable regardless of the order the ids were toggled in.
	const enabledMetrics = useMemo( () => {
		const selected = new Set( metrics );
		return ALL_TIME_STATS_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metrics ] );

	const tiles = useMemo(
		() =>
			enabledMetrics.flatMap( ( { id, label } ): AllTimeStatsTile[] => {
				const value = summaryCount( summary, id );
				return value === undefined
					? []
					: [ { key: id, label, icon: TILE_CONFIG[ id ].icon, value } ];
			} ),
		[ enabledMetrics, summary ]
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
				isError={ tiles.length === 0 && isError }
				isEmpty={ tiles.length === 0 }
				error={ {
					description: __(
						"We couldn't load all-time stats. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: trendingUp,
					// No metrics selected is a configuration state, not an absence of
					// data — prompt to pick one rather than implying there are no stats.
					description:
						enabledMetrics.length === 0
							? __( 'Select at least one metric to display.', 'jetpack-premium-analytics-pkg' )
							: __( 'No stats recorded yet.', 'jetpack-premium-analytics-pkg' ),
				} }
				// `tiles` is empty until the response lands, so the skeleton counts
				// the enabled metrics instead.
				renderLoading={ <MetricTileGridSkeleton tiles={ enabledMetrics.length } /> }
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

export default function AllTimeStats( { attributes = {} }: AllTimeStatsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
