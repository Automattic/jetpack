/**
 * External dependencies
 */
import {
	useStatsTopAuthors,
	type StatsNormalizedReport,
	type StatsReportParams,
	type StatsTopAuthorsItem,
} from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
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

type AuthorsWidgetProps = {
	/**
	 * Maximum number of authors to display.
	 */
	max?: number;
};

type StatsTopAuthorsReport = StatsNormalizedReport< StatsTopAuthorsItem >;

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
	} = useStatsTopAuthors( reportParams as StatsReportParams );

	// `primary.isPending` also covers the brief window where the query is disabled
	// while the report params resolve (isLoading is false there).
	const isInitialLoading = ( isLoading || primary.isPending ) && ! hasData;
	const isRefetching = isFetching && hasData;
	const primaryData = primary.data as StatsTopAuthorsReport | undefined;
	const comparisonData = comparison.data as StatsTopAuthorsReport | undefined;

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
				emptyStateIcon={ customer }
				emptyStateText={ __(
					'Learn about your most popular authors to better understand how they contribute to grow your site.',
					'jetpack-premium-analytics'
				) }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}
