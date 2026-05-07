/**
 * Merged active+history threat query backing the Protect Scan v2 list.
 *
 * Calls `siteScanQuery()` and `siteScanHistoryQuery()` in parallel and
 * returns one deduped `Threat[]` keyed by id (active rows win on
 * collision so a current threat never appears under its history copy).
 *
 * Per spec §5 the consumer's error UX depends on which query failed:
 * active failure clears `data` to `[]` and surfaces `activeError` so the
 * consumer renders an error block; history failure keeps the active rows
 * and surfaces `historyError` for a retry snackbar; if both fail, `data`
 * is `[]` and both errors are set.
 */
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from '@wordpress/element';
import { siteScanHistoryQuery, siteScanQuery } from './query-options';
import type { Threat } from './types';

export type UseScanThreatsResult = {
	data: Threat[];
	isLoading: boolean;
	isFetching: boolean;
	activeError: Error | null;
	historyError: Error | null;
	refetch: () => void;
};

/**
 * Returns the merged active+history threat list along with the per-query
 * loading / error state and a `refetch()` that re-runs both queries.
 *
 * @return The merged dataset plus loading + error state.
 */
export function useScanThreatsQuery(): UseScanThreatsResult {
	const active = useQuery( siteScanQuery() );
	const history = useQuery( siteScanHistoryQuery() );

	const activeData = active.data;
	const historyData = history.data;
	const activeRefetch = active.refetch;
	const historyRefetch = history.refetch;

	const data = useMemo< Threat[] >( () => {
		const seen = new Map< string, Threat >();
		for ( const t of activeData?.threats ?? [] ) {
			seen.set( String( t.id ), t );
		}
		for ( const t of historyData?.threats ?? [] ) {
			if ( ! seen.has( String( t.id ) ) ) {
				seen.set( String( t.id ), t );
			}
		}
		return Array.from( seen.values() );
	}, [ activeData, historyData ] );

	const refetch = useCallback( () => {
		activeRefetch();
		historyRefetch();
	}, [ activeRefetch, historyRefetch ] );

	return {
		data: active.error ? [] : data,
		isLoading: active.isLoading || history.isLoading,
		isFetching: active.isFetching || history.isFetching,
		activeError: ( active.error as Error | null ) ?? null,
		historyError: ( history.error as Error | null ) ?? null,
		refetch,
	};
}
