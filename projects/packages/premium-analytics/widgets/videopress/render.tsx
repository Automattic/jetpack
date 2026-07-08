/**
 * External dependencies
 */
import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	formatLegendLabels,
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
import { buildVideoPlaysData } from './build-video-plays-data';
import type { VideoPressAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

const DEFAULT_MAX = 7;

// The dashboard injects its date range and comparison state through
// `reportParams`; the widget's own settings come from `VideoPressAttributes`.
type VideoPressRenderAttributes = VideoPressAttributes & Partial< ReportParamsFieldAttributes >;

type VideoPressWidgetProps = WidgetRenderProps< VideoPressRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

// Resolve the `max` attribute to the row count requested from Stats. Per the
// Stats widget contract `max = 0` means "all rows", so it passes through; only
// negative or non-numeric values fall back to the default.
const toMaxRows = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed >= 0 ? parsed : fallback;
};

type VideoPressLeaderboardProps = {
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
 * Presentational leaderboard for the VideoPress widget. Renders the site's most
 * played VideoPress videos and is responsible only for the loading, empty, and
 * populated states.
 *
 * @param {VideoPressLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
function VideoPressLeaderboard( {
	data = [],
	isLoading = false,
	isRefetching = false,
	withComparison = false,
	legendLabels,
}: VideoPressLeaderboardProps ) {
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
					options: { useMultipliers: true, decimals: 0 },
				} }
				emptyStateIcon={ video }
				emptyStateText={ __(
					'Learn which VideoPress videos your visitors watch most to understand what keeps them engaged.',
					'jetpack-premium-analytics'
				) }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

type VideoPressReportProps = {
	/**
	 * Maximum number of videos to display.
	 */
	max: number;
};

/**
 * Fetches the video-plays report through the Jetpack Stats hook, builds the
 * leaderboard rows, and hands them to the presentational `VideoPressLeaderboard`.
 *
 * @param {VideoPressReportProps} props - The component props.
 * @return The widget content.
 */
function VideoPressReport( { max }: VideoPressReportProps ) {
	const { reportParams } = useWidgetRootContext();
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useStatsVideoPlays( statsParams );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;
	const primaryData = primary.data;
	const comparisonData = comparison.data;

	const chartData = useMemo(
		() => buildVideoPlaysData( primaryData, comparisonData ),
		[ primaryData, comparisonData ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	return (
		<VideoPressLeaderboard
			data={ chartData }
			isLoading={ isInitialLoading }
			isRefetching={ isRefetching }
			withComparison={ hasComparison }
			legendLabels={ legendLabels }
		/>
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
