/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetRoot,
	WidgetState,
	calculateDelta,
	toMaxRows,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toVideoPlaysRows, type VideoPlaysRow } from './build-video-plays-data';
import styles from './style.module.css';
import { DEFAULT_MAX, type VideoPressAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget's own settings come from `VideoPressAttributes`.
type VideoPressRenderAttributes = VideoPressAttributes & Partial< ReportParamsFieldAttributes >;

type VideoPressWidgetProps = WidgetRenderProps< VideoPressRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Maps normalized video rows onto the shape `LeaderboardChart` expects. Each
 * row's label opens the video's page in a new tab when the report carries a
 * URL. Shares are computed against the largest value of either period so the
 * overlay bars stay proportional. Rows without a matching comparison-period
 * value keep `previousValue`/`previousShare`/`delta` as `undefined` so the
 * chart suppresses their delta instead of fabricating a vs-zero change.
 *
 * @param rows - The normalized video-plays rows.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( rows: VideoPlaysRow[] ): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxPlays = Math.max( ...rows.flatMap( row => [ row.plays, row.previousPlays ?? 0 ] ), 1 );

	return rows.map( row => ( {
		id: row.key,
		label: row.link ? (
			<Link
				className={ styles.labelLink }
				href={ row.link }
				variant="unstyled"
				openInNewTab
				title={ row.label }
			>
				{ row.label }
			</Link>
		) : (
			<span className={ styles.labelText } title={ row.label }>
				{ row.label }
			</span>
		),
		currentValue: row.plays,
		currentShare: ( row.plays / maxPlays ) * 100,
		previousValue: row.previousPlays,
		previousShare:
			row.previousPlays !== undefined ? ( row.previousPlays / maxPlays ) * 100 : undefined,
		delta:
			row.previousPlays !== undefined ? calculateDelta( row.plays, row.previousPlays ) : undefined,
	} ) );
}

type VideoPressReportProps = {
	/**
	 * Maximum number of videos to display.
	 */
	max: number;
};

/**
 * Fetches the video-plays report through the Jetpack Stats hook, builds the
 * leaderboard rows, and renders them through the shared widget content states.
 *
 * @param {VideoPressReportProps} props - The component props.
 * @return The widget content.
 */
function VideoPressReport( { max }: VideoPressReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

	// The hook merges comparison rows in the data layer and gates
	// `hasComparison` on at least one visible row (`maxRows`) having a matching
	// comparison row, so the chart never fabricates vs-zero deltas.
	const {
		primary,
		comparisonRows,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		refetch,
	} = useStatsVideoPlays( statsParams, { maxRows: max } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;

	const rows = useMemo( () => toVideoPlaysRows( comparisonRows?.rows ?? [] ), [ comparisonRows ] );

	const chartData = useMemo( () => buildLeaderboardData( rows ), [ rows ] );

	return (
		<WidgetState
			isLoading={ isInitialLoading }
			isFetching={ isFetching }
			isError={ isError }
			isEmpty={ rows.length === 0 }
			error={ {
				description: __(
					"We couldn't load video plays. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: video,
				description: __(
					'Learn which VideoPress videos your visitors watch most to understand what keeps them engaged.',
					'jetpack-premium-analytics'
				),
			} }
		>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
				withOverlayLabel
				showLegend={ false }
				dataFormat={ {
					type: 'number',
					options: { useMultipliers: true, decimals: 0 },
				} }
			/>
		</WidgetState>
	);
}

/**
 * VideoPress widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them.
 *
 * @param {VideoPressWidgetProps} props - The widget render props.
 * @return The rendered VideoPress widget.
 */
export default function VideoPress( { attributes = {}, setError }: VideoPressWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<VideoPressReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
