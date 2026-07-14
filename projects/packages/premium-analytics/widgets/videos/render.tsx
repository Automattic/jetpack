/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetRoot,
	WidgetState,
	formatLegendLabels,
	toMaxRows,
	useWidgetRootContext,
	type LeaderboardChartData,
	type LegendLabels,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildVideoPlaysDataWithComparison } from './build-video-plays-data';
import { DEFAULT_MAX, type VideosAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget's own settings come from `VideosAttributes`.
type VideosRenderAttributes = VideosAttributes & Partial< ReportParamsFieldAttributes >;

type VideosWidgetProps = WidgetRenderProps< VideosRenderAttributes >;

type VideosLeaderboardProps = {
	/**
	 * Leaderboard rows to render, already built from the video-plays report.
	 */
	data?: LeaderboardChartData;
	/**
	 * When `true`, render each row's previous-period delta next to its value.
	 */
	withComparison?: boolean;
	/**
	 * Custom legend labels for the current/comparison periods.
	 */
	legendLabels?: LegendLabels;
};

/**
 * Presentational leaderboard for the Videos widget. Renders only the populated
 * (ready) state — loading, error, and empty are handled by `<WidgetState>` in
 * the data-connected report.
 *
 * @param {VideosLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
function VideosLeaderboard( {
	data = [],
	withComparison = false,
	legendLabels,
}: VideosLeaderboardProps ) {
	return (
		<LeaderboardChart
			data={ data }
			withComparison={ withComparison }
			legendLabels={ legendLabels }
			dataFormat={ {
				type: 'number',
				options: { useMultipliers: false, decimals: 0 },
			} }
		/>
	);
}

type VideosReportProps = {
	/**
	 * Maximum number of videos to display.
	 */
	max: number;
};

/**
 * Fetches the video-plays report through the Jetpack Stats hook, builds the
 * leaderboard rows, and hands them to the presentational `VideosLeaderboard`.
 *
 * @param {VideosReportProps} props - The component props.
 * @return The widget content.
 */
function VideosReport( { max }: VideosReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

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

	const { data: chartData } = useMemo(
		() => buildVideoPlaysDataWithComparison( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	return (
		<WidgetState
			isLoading={ isInitialLoading }
			isFetching={ isFetching }
			// The Stats queries carry `placeholderData`, so a failed range change keeps
			// the prior period's rows visible; only surface the error when there is
			// nothing to show.
			isError={ chartData.length === 0 && isError }
			isEmpty={ chartData.length === 0 }
			error={ {
				description: __(
					"We couldn't load video plays. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: video,
				description: __( 'No video plays in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<VideosLeaderboard
				data={ chartData }
				withComparison={ hasComparison }
				legendLabels={ legendLabels }
			/>
		</WidgetState>
	);
}

/**
 * Videos widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them.
 *
 * @param {VideosWidgetProps} props - The widget render props.
 * @return The rendered Videos widget.
 */
export default function Videos( { attributes = {} }: VideosWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VideosReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
