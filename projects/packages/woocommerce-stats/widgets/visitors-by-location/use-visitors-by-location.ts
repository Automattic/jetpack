/**
 * External dependencies
 */
import { useMemo } from 'react';
import { useReportVisitorsByLocation } from '../../src/reports';
import type { LocationRowInput, ReportParams } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */

export type Region = 'US' | 'world';

type LocationItem = {
	region?: string | null;
	country_code: string;
	label: string;
	visitors: number;
};

const toEntries = ( items: readonly LocationItem[], region: Region ) =>
	region === 'US'
		? items
				.filter( item => Boolean( item.region ) )
				.map( item => ( {
					id: item.region as string,
					label: item.region as string,
					value: item.visitors,
				} ) )
		: items.map( item => ( {
				id: item.country_code.toLowerCase(),
				label: item.label,
				value: item.visitors,
			} ) );

/**
 * The visitors by location report of the region as location rows: US states, or countries.
 *
 * @param {ReportParams} reportParams - The report params from the widget root.
 * @param {Region}       region       - Which ranking to read.
 * @return {object} The rows and the request status.
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
	const report = region === 'US' ? usReport : worldReport;
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
	} = report;

	const rows = useMemo< LocationRowInput[] >( () => {
		const previous = new Map(
			toEntries( comparison.data?.data ?? [], region ).map( entry => [ entry.id, entry.value ] )
		);
		return toEntries( primary.data?.data ?? [], region ).map( entry => ( {
			...entry,
			previousValue: previous.get( entry.id ),
		} ) );
	}, [ primary.data, comparison.data, region ] );

	return { rows, hasComparison, isLoading, isFetching, hasData, isError, error, refetch };
}
