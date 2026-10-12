import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { fetchBackupSizes } from '../data/api/backup-sizes';
import { matchBackupRun, type BackupRun } from '../data/normalize/backup-runs';
import { keys } from '../data/query-client';
import { useCanQueryWpcom } from './use-connection';
import type { BackupActivityItem } from '../types/activity';

type BackupRow = Pick< BackupActivityItem, 'rewindId' | 'isRewindable' | 'backupPeriod' >;

export type BackupRunLookup = ( item: BackupRow ) => BackupRun | null;

/**
 * Size and duration of the given backup rows, paging through the bridge until the oldest is covered.
 *
 * A backup's size never changes, so loaded pages are kept until a row newer than them appears.
 *
 * @param rows - The backup rows on screen.
 * @return A lookup answering null until a row's own record has loaded.
 */
export function useBackupRuns( rows: BackupRow[] ): BackupRunLookup {
	// A row WordPress.com has no record for must not send the query paging to the end.
	const starts = rows.flatMap( row =>
		row.isRewindable && row.backupPeriod !== null ? [ row.backupPeriod ] : []
	);
	const oldest = starts.length > 0 ? Math.min( ...starts ) : null;
	const newest = starts.length > 0 ? Math.max( ...starts ) : null;

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
	// Another caller may have stamped an older row, so check for the record before refetching.
	const hasNewest = records.some( record => record.period === newest );

	// The rows the last request was for; after a failure, only new rows earn another try.
	const attemptedFor = useRef( '' );

	useEffect( () => {
		const rowsKey = `${ newest }:${ oldest }`;
		if ( ! data || isFetching || ( isError && attemptedFor.current === rowsKey ) ) {
			return;
		}
		if ( newest !== null && newest > seenUpTo && ! hasNewest ) {
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
		hasNewest,
		oldestLoaded,
		hasNextPage,
		refetch,
		fetchNextPage,
	] );

	return useCallback( item => matchBackupRun( item, records ), [ records ] );
}
