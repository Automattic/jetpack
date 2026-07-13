/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	formatLegendLabels,
	toMaxRows,
	useWidgetError,
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
import type { ComponentProps } from 'react';

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget's own settings come from `VideosAttributes`.
type VideosRenderAttributes = VideosAttributes & Partial< ReportParamsFieldAttributes >;

type VideosWidgetProps = WidgetRenderProps< VideosRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

type VideosLeaderboardProps = {
	/**
	 * Leaderboard rows to render, already built from the video-plays report.
	 * When omitted, the empty state is shown (unless `isLoading` is set).
	 */
	data?: LeaderboardChartData;
	/**
	 * When `true`, the initial loading overlay is rendered instead of the chart.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, a loading overlay is layered over the chart while data
	 * refetches in the background.
	 */
	isRefetching?: boolean;
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
 * Presentational leaderboard for the Videos widget. Renders the site's most
 * played videos and is responsible only for the loading, empty, and populated
 * states.
 *
 * @param {VideosLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
function VideosLeaderboard( {
	data = [],
	isLoading = false,
	isRefetching = false,
	withComparison = false,
	legendLabels,
}: VideosLeaderboardProps ) {
	if ( isLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<LeaderboardChart
				data={ data }
				withComparison={ withComparison }
				legendLabels={ legendLabels }
				dataFormat={ {
					type: 'number',
					options: { useMultipliers: false, decimals: 0 },
				} }
				emptyStateIcon={ video }
				emptyStateText={ __(
					'Learn which videos your visitors watch most to understand what keeps them engaged.',
					'jetpack-premium-analytics'
				) }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
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
		error,
		refetch,
	} = useStatsVideoPlays( statsParams, { maxRows: max } );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;

	const { data: chartData } = useMemo(
		() => buildVideoPlaysDataWithComparison( comparisonRows?.rows ?? [] ),
		[ comparisonRows ]
	);
	const withComparison = hasComparison;

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	return (
		<VideosLeaderboard
			data={ chartData }
			isLoading={ isInitialLoading }
			isRefetching={ isRefetching }
			withComparison={ withComparison }
			legendLabels={ legendLabels }
		/>
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
export default function Videos( { attributes = {}, setError }: VideosWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<VideosReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
