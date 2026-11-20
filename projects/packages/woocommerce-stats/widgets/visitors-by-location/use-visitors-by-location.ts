/**
 * External dependencies
 */
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportVisitorsByLocation } from '../../src/reports';
import type { LocationRowInput, ReportParams } from '@automattic/jetpack-premium-analytics-sdk';

type LocationItem = {
	country_code: string;
	country_name?: string | null;
	label: string;
	visitors: number;
};

const toEntries = ( items: readonly LocationItem[] ) =>
	items.map( item => ( {
		id: item.country_code.toLowerCase(),
		label: item.country_name || item.label,
		value: item.visitors,
	} ) );

/**
 * The visitors by location report as location rows, one per country.
 *
 * @param {ReportParams} reportParams - The report params from the widget root.
 * @return {object} The rows and the request status.
 */
export function useVisitorsByLocation( reportParams: ReportParams ) {
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
	} = useReportVisitorsByLocation( reportParams, {
		groupBy: 'country',
		limit: 15,
	} );

	const rows = useMemo< LocationRowInput[] >( () => {
		const previous = new Map(
			toEntries( comparison.data?.data ?? [] ).map( entry => [ entry.id, entry.value ] )
		);

		return toEntries( primary.data?.data ?? [] ).map( entry => ( {
			...entry,
			previousValue: previous.get( entry.id ),
		} ) );
	}, [ primary.data, comparison.data ] );

	return { rows, hasComparison, isLoading, isFetching, hasData, isError, error, refetch };
}
