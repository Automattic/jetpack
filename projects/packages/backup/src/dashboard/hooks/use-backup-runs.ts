import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { fetchBackupSizes } from '../data/api/backup-sizes';
import { matchBackupRun, type BackupRun } from '../data/normalize/backup-runs';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
import type { BackupActivityItem } from '../types/activity';

type BackupRow = Pick< BackupActivityItem, 'rewindId' | 'isDiscarded' >;

export type BackupRunLookup = ( item: BackupRow ) => BackupRun | null;

/**
 * Size and duration of the given backup rows, paging through the bridge until the oldest is covered.
 *
 * A backup's size never changes, so loaded pages are kept until a row newer than them appears.
 *
 * @param rows - The backup rows on screen; a rewind id is its backup's finish time.
 * @return A lookup answering null until a row's own record has loaded.
 */
export function useBackupRuns( rows: BackupRow[] ): BackupRunLookup {
	// A discarded backup has no record, so it must not send the query paging to the end.
	const finishes = rows
		.filter( row => ! row.isDiscarded )
		.map( row => Number( row.rewindId ) )
		.filter( Number.isFinite );
	const oldest = finishes.length > 0 ? Math.min( ...finishes ) : null;
	const newest = finishes.length > 0 ? Math.max( ...finishes ) : null;

	// `newest` stamps the answer rather than selecting it, so keying on it would split one cache.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const { data, hasNextPage, isFetching, isError, fetchNextPage, refetch } = useInfiniteQuery( {
		queryKey: keys.backupSizes(),
		// A row only exists once its backup has finished, so a request sent after seeing
		// it holds its record — a causal bound, where clocks would disagree.
		queryFn: async ( { pageParam } ) => ( {
			...( await fetchBackupSizes( pageParam ) ),
			seenUpTo: newest ?? 0,
		} ),
		initialPageParam: 1,
		getNextPageParam: ( last, _all, lastPage ) =>
			lastPage < last.totalPages ? lastPage + 1 : undefined,
		staleTime: Infinity,
		enabled: useCanQueryWpcom() && oldest !== null,
	} );

	const records = useMemo( () => data?.pages.flatMap( page => page.backups ) ?? [], [ data ] );
	const seenUpTo = data?.pages[ 0 ]?.seenUpTo ?? 0;
	const oldestLoaded = records.reduce(
		( min, record ) => Math.min( min, record.period ),
		Infinity
	);

	useEffect( () => {
		// Never after a failure: retrying on render would hammer an upstream that is down.
		if ( ! data || isFetching || isError ) {
			return;
		}
		if ( newest !== null && newest > seenUpTo ) {
			refetch( { cancelRefetch: false } );
		} else if ( oldest !== null && hasNextPage && oldestLoaded > oldest ) {
			fetchNextPage( { cancelRefetch: false } );
		}
	}, [
		data,
		isFetching,
		isError,
		newest,
		oldest,
		seenUpTo,
		oldestLoaded,
		hasNextPage,
		refetch,
		fetchNextPage,
	] );

	return useCallback( item => matchBackupRun( item, records, seenUpTo ), [ records, seenUpTo ] );
}
