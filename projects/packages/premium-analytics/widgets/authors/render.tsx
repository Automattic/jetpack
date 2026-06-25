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
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { postAuthor } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildTopAuthorsData } from './build-top-authors-data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

const DEFAULT_MAX = 7;

type AuthorsAttributes = NonNullable< ComponentProps< typeof WidgetRoot >[ 'attributes' ] > & {
	max?: string | number;
};

type AuthorsRenderProps = WidgetRenderProps< AuthorsAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const toPositiveInt = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed > 0 ? parsed : fallback;
};

const toDateString = ( date: Date ) => {
	const pad = ( part: number ) => String( part ).padStart( 2, '0' );

	return `${ date.getFullYear() }-${ pad( date.getMonth() + 1 ) }-${ pad( date.getDate() ) }`;
};

/**
 * Build a "very long" default report range (all time, through the end of
 * today) used when the host doesn't pass explicit report params. Explicit
 * from/to pass through `normalizeReportParams` untouched, so this wide range
 * survives WidgetRoot's normalization instead of the rolling default preset.
 *
 * TODO: Remove the default range once we have a way to pass the launched date to the widget.
 *
 * @return The default report params covering an all-time range.
 */
const getDefaultReportParams = () => ( {
	from: '2000-01-01T00:00:00',
	to: `${ toDateString( new Date() ) }T23:59:59`,
	interval: 'day' as const,
} );

/**
 * Authors widget inner component. Reads report params from WidgetRoot context,
 * fetches the site's top authors by views from the Jetpack Stats API, and
 * renders them as a leaderboard with optional period comparison.
 *
 * @param props     - Component props.
 * @param props.max - Maximum number of authors to display.
 * @return The rendered leaderboard content.
 */
function AuthorsLeaderboard( { max }: { max: number } ) {
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
		() => buildTopAuthorsData( primaryData, comparisonData, max ),
		[ primaryData, comparisonData, max ]
	);

	const legendLabels = useMemo( () => formatLegendLabels( reportParams ), [ reportParams ] );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<LeaderboardChart
				data={ chartData }
				withComparison={ hasComparison }
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
 * Authors widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the
 * resolved report params consumed by the inner leaderboard.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @param props.setError   - Dashboard error handler.
 * @return The rendered Authors widget.
 */
export default function Authors( { attributes = {}, setError }: AuthorsRenderProps ) {
	const attributesWithDefaults = useMemo( () => {
		const hasReportParams =
			!! attributes.reportParams && Object.keys( attributes.reportParams ).length > 0;

		return hasReportParams ? attributes : { ...attributes, reportParams: getDefaultReportParams() };
	}, [ attributes ] );

	return (
		<WidgetRoot attributes={ attributesWithDefaults } setError={ setError }>
			<AuthorsLeaderboard max={ toPositiveInt( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
