/**
 * External dependencies
 */
import { useStatsTopAuthors } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { LeaderboardChart } from '../../components/chart-leaderboard';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
import { useWidgetRootContext } from '../../components/widget-root';
import { buildTopAuthorsData, formatLegendLabels } from '../../helpers';
import { useWidgetError } from '../../hooks';

const DEFAULT_MAX = 7;

type AuthorsWidgetProps = {
	/**
	 * Maximum number of authors to display.
	 */
	max?: number;
};

/**
 * Authors Widget Component
 *
 * Displays a leaderboard chart showing the site's top authors by views,
 * sourced from the Jetpack Stats API.
 *
 * Features:
 * - Comparison support (current vs previous period)
 * - Configurable author limit
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @param props     - Component props
 * @param props.max - Maximum number of authors to display
 *
 * @example
 * <WidgetRoot attributes={ attributes }>
 *   <AuthorsWidget />
 * </WidgetRoot>
 */
export function AuthorsWidget( { max }: AuthorsWidgetProps ) {
	const { reportParams } = useWidgetRootContext();
	const maxAuthors = max ?? DEFAULT_MAX;
	const statsParams = useMemo(
		() => ( { ...reportParams, max: maxAuthors } ),
		[ reportParams, maxAuthors ]
	);

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
		() => buildTopAuthorsData( primaryData, comparisonData, maxAuthors ),
		[ primaryData, comparisonData, maxAuthors ]
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
				emptyStateText={ __(
					'Learn about your most popular authors to better understand how they contribute to growing your site.',
					'jetpack-premium-analytics'
				) }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
