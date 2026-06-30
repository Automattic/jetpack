/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
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
import { postAuthor } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTopAuthorsData } from './build-top-authors-data';
import type { AuthorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

const DEFAULT_MAX = 7;

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type AuthorsRenderAttributes = AuthorsAttributes & Partial< ReportParamsFieldAttributes >;

type AuthorsRenderProps = WidgetRenderProps< AuthorsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const toPositiveInt = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed > 0 ? parsed : fallback;
};

export type AuthorsLeaderboardProps = {
	/**
	 * Leaderboard rows to render, already built from the top-authors report.
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
 * Presentational leaderboard for the Authors widget. Renders the site's top
 * authors by views, and is responsible only for the loading, empty, and
 * populated states.
 *
 * Takes already-built rows via props (and is exported) so Storybook can
 * exercise those states with fixture data — there is no Stats backend in
 * Storybook, so the data-connected entry point would only ever show chrome.
 *
 * @param props                - Component props.
 * @param props.data           - Leaderboard rows to render.
 * @param props.isLoading      - Whether to render the initial loading overlay.
 * @param props.isRefetching   - Whether to layer a loading overlay over the chart.
 * @param props.withComparison - Whether to render previous-period deltas.
 * @param props.legendLabels   - Custom labels for the current/comparison periods.
 * @return The rendered leaderboard.
 */
export function AuthorsLeaderboard( {
	data = [],
	isLoading = false,
	isRefetching = false,
	withComparison = false,
	legendLabels,
}: AuthorsLeaderboardProps ) {
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
				emptyStateIcon={ postAuthor }
				emptyStateText={ __(
					'Learn about your most popular authors to better understand how they contribute to growing your site.',
					'jetpack-premium-analytics'
				) }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

/**
 * Fetches the top-authors report through the Jetpack Stats hook, builds the
 * leaderboard rows, and hands them to the presentational `AuthorsLeaderboard`.
 *
 * @param props     - Component props.
 * @param props.max - Maximum number of authors to display.
 * @return The widget content.
 */
function AuthorsReport( { max }: { max: number } ) {
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
	} = useStatsTopAuthors( statsParams );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;
	const primaryData = primary.data;
	const comparisonData = comparison.data;

	const chartData = useMemo(
		() => buildTopAuthorsData( primaryData, comparisonData ),
		[ primaryData, comparisonData ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	return (
		<AuthorsLeaderboard
			data={ chartData }
			isLoading={ isInitialLoading }
			isRefetching={ isRefetching }
			withComparison={ hasComparison }
			legendLabels={ legendLabels }
		/>
	);
}

/**
 * Authors widget render entry point.
 *
 * Passes host `attributes` into `WidgetRoot`, which resolves the report params:
 * the dashboard leaves `reportParams` out of `attributes`, so it falls back to
 * the date-range URL search params the picker writes to; Storybook injects
 * `attributes.reportParams` directly. The widget's own `max` is forwarded to
 * the inner component.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @param props.setError   - Dashboard error handler.
 * @return The rendered Authors widget.
 */
export default function Authors( { attributes = {}, setError }: AuthorsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<AuthorsReport max={ toPositiveInt( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
