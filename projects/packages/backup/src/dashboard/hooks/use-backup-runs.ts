import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { fetchBackupSizes } from '../data/api/backup-sizes';
import { matchBackupRun, type BackupRun } from '../data/normalize/backup-runs';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
import type { BackupActivityItem } from '../types/activity';

type BackupRow = Pick< BackupActivityItem, 'rewindId' | 'isRewindable' >;

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
	// A row WordPress.com has no record for must not send the query paging to the end.
	const finishes = rows
		.filter( row => row.isRewindable )
		.map( row => Number( row.rewindId ) )
		.filter( Number.isFinite );
	const oldest = finishes.length > 0 ? Math.min( ...finishes ) : null;
	const newest = finishes.length > 0 ? Math.max( ...finishes ) : null;

	// `newest` stamps the answer rather than selecting it, so keying on it would split one cache.
	// eslint-disable-next-line @tanstack/query/exhaustive-deps
	const { data, hasNextPage, isFetching, isError, fetchNextPage, refetch } = useInfiniteQuery( {
		queryKey: keys.backupSizes(),
		// A row only exists once its backup has finished, so a request sent after seeing
		// it holds its record.
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

	// The rows the last request was for; after a failure, only new rows earn another try.
	const attemptedFor = useRef( '' );

	useEffect( () => {
		const rowsKey = `${ newest }:${ oldest }`;
		if ( ! data || isFetching || ( isError && attemptedFor.current === rowsKey ) ) {
			return;
		}
		if ( newest !== null && newest > seenUpTo ) {
			attemptedFor.current = rowsKey;
			refetch( { cancelRefetch: false } );
		} else if ( oldest !== null && hasNextPage && oldestLoaded > oldest ) {
			attemptedFor.current = rowsKey;
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
