/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricTileGrid,
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

// The host (and Storybook) may inject report params via `attributes`, but the
// totals are all-time: the summary query takes no date params, so the picker's
// range and comparison state do not change what this widget shows.
type AllTimeStatsRenderAttributes = AllTimeStatsAttributes & Partial< ReportParamsFieldAttributes >;
type AllTimeStatsWidgetProps = WidgetRenderProps< AllTimeStatsRenderAttributes >;

/**
 * The all-time summary carries dynamic WPCOM keys (`views`, `visitors`,
 * `posts`, `comments`, …); values arrive numeric or as numeric strings, so
 * each field is read defensively.
 */
type StatsSummary = Record< string, unknown >;

const COUNT_FORMAT: DataFormat = {
	type: 'number',
	options: { decimals: 0 },
};

/**
 * Render-only config per metric: the tile icon. Ids and labels are shared with
 * the settings checkboxes via `ALL_TIME_STATS_METRICS` in `widget.ts`; the id
 * doubles as the summary field the tile reads.
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

/**
 * Fetches the all-time site summary through the designated `useStatsSite` hook
 * and renders the lifetime totals as a grid of metric tiles. Which tiles
 * appear is controlled by the `metrics` attribute; fields absent from the
 * response are skipped. There is no comparison period for this module, so each
 * value renders as a bare number.
 *
 * @param {AllTimeStatsMetricId[]} metrics - Enabled metric row ids.
 * @return The widget content.
 */
function AllTimeStatsReport( {
	metrics = DEFAULT_ALL_TIME_STATS_METRICS,
}: {
	metrics?: AllTimeStatsMetricId[];
} ) {
	// The summary is all-time, so the query takes no date params — its key stays
	// stable across dashboard date-range and comparison changes.
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
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the totals visible; only surface the error
				// when there is nothing to show.
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
			>
				<MetricTileGrid tiles={ tiles } dataFormat={ COUNT_FORMAT } />
			</WidgetState>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner
 * report needs. This widget is all-time, so it does not read the dashboard date
 * range; report params still flow into WidgetRoot for parity with the other
 * Stats widgets.
 *
 * @param {AllTimeStatsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function AllTimeStats( { attributes = {} }: AllTimeStatsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeStatsReport metrics={ attributes.metrics } />
		</WidgetRoot>
	);
}
