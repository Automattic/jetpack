/**
 * External dependencies
 */
import { type ReportParams, useReportVisitorsByLocation } from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import {
	buildVisitorsByLocationData,
	type Region,
	type LocationDataEntry,
} from '../../helpers/build-visitors-by-location-data';

export type { Region };

type LocationRawData = {
	primary: LocationDataEntry[];
	comparison: LocationDataEntry[];
};

/**
 * Hook to fetch and build visitors by location chart data.
 *
 * @param reportParams - Report parameters from widget context
 * @param region       - The region to get data for ('US' or 'world')
 * @return Geo chart data and leaderboard data for the selected region
 */
export function useVisitorsByLocation( reportParams: ReportParams, region: Region ) {
	const usReport = useReportVisitorsByLocation( reportParams, {
		enabled: region === 'US',
		groupBy: 'region',
		countryCode: 'US',
		limit: 100,
	} );

	const worldReport = useReportVisitorsByLocation( reportParams, {
		enabled: region === 'world',
		groupBy: 'country',
		limit: 15,
	} );

	const activeReport = region === 'US' ? usReport : worldReport;
	const hasComparison = activeReport.hasComparison;

	const rawData: LocationRawData = useMemo( () => {
		const primaryItems = activeReport.primary.data?.data ?? [];
		const comparisonItems = activeReport.comparison.data?.data ?? [];

		if ( region === 'US' ) {
			const mapUsRegions = ( items: typeof primaryItems ) =>
				items
					.filter( item => Boolean( item.region ) )
					.map( item => ( {
						id: item.region as string,
						label: item.region as string,
						value: item.visitors,
					} ) );

			return {
				primary: mapUsRegions( primaryItems ),
				comparison: mapUsRegions( comparisonItems ),
			};
		}

		return {
			primary: primaryItems.map( item => ( {
				id: item.country_code.toLowerCase(),
				label: item.label,
				value: item.visitors,
			} ) ),
			comparison: comparisonItems.map( item => ( {
				id: item.country_code.toLowerCase(),
				label: item.label,
				value: item.visitors,
			} ) ),
		};
	}, [ region, activeReport.primary.data, activeReport.comparison.data ] );

	const chartDataResult = useMemo(
		() =>
			buildVisitorsByLocationData( {
				primaryData: rawData.primary,
				comparisonData: hasComparison ? rawData.comparison : undefined,
				region,
			} ),
		[ rawData.primary, rawData.comparison, region, hasComparison ]
	);

	const { isLoading, isFetching, hasData, isError, error, refetch } = activeReport;

	return {
		...chartDataResult,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	};
}
