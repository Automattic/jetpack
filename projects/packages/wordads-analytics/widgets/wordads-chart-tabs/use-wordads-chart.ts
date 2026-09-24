/**
 * External dependencies
 */
import {
	buildMetricTab,
	type ReportParams,
	type StatsPeriod,
	type StatsWordAdsResponse,
	useStatsWordAdsStats,
} from '@automattic/jetpack-premium-analytics-api';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { WORDADS_CHART_METRICS } from './metrics';

export type WordAdsPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * The WordAds fields as metric tabs, in the Calypso WordAds page's labels and order.
 * One request returns all three, so — unlike the traffic chart's split requests — a
 * single `useStatsWordAdsStats` call drives every tab.
 */
export default function useWordAdsChart( reportParams: ReportParams, period: WordAdsPeriod ) {
	// Memoize the request params so the query key is stable across renders.
	const params = useMemo( () => ( { ...reportParams, period } ), [ reportParams, period ] );

	const { primary, timezone, isLoading, isFetching, isError, refetch } =
		useStatsWordAdsStats( params );

	const primaryData = primary.data as StatsWordAdsResponse | undefined;

	const metrics = useMemo(
		() =>
			WORDADS_CHART_METRICS.map( metric => ( {
				...buildMetricTab( {
					primary: primaryData,
					comparison: undefined,
					hasComparison: false,
					field: metric.id,
					label: metric.label,
					dataFormat: metric.dataFormat,
					countLabel: metric.countLabel,
					zone: timezone,
				} ),
				// Only CPM goes null, when nothing was served: a ratio of nothing, not a zero.
				...( primaryData?.summary[ metric.id ] === null
					? {
							unavailable: __(
								'No ads were served in this period.',
								'jetpack-wordads-analytics-pkg'
							),
						}
					: {} ),
			} ) ),
		[ primaryData, timezone ]
	);

	return {
		metrics,
		isLoading,
		isFetching,
		// `placeholderData` keeps the previous chart while `isError` flips true; gate
		// the error on having nothing to show, as `useTrafficChart` does.
		isError: isError && ! primaryData?.data?.length,
		isEmpty: primaryData !== undefined && ! primaryData.data?.length,
		refetch,
	};
}
