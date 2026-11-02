import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

type Args = {
	/** Count of watched backup runs that have ended. */
	finishedRuns: number;
	/** The newest backup row on screen, or null when none or not on the newest page. */
	topBackupId: string | null;
	/** True on page 1, newest first, once its rows have loaded. */
	isReady: boolean;
};

/**
 * The id of the backup row a watched run just produced, and a way to clear it.
 *
 * The baseline is taken only while the list is ready: a run that ends on another page
 * or mid-load has nothing to compare against, so it never marks a row.
 *
 * @param args              - Hook arguments.
 * @param args.finishedRuns - Count of watched backup runs that have ended.
 * @param args.topBackupId  - The newest backup row on screen, or null.
 * @param args.isReady      - Whether the newest page has loaded.
 * @return The new row's id (or null) and a clear function.
 */
export function useNewBackupRow( { finishedRuns, topBackupId, isReady }: Args ): {
	newRowId: string | null;
	clearNewRow: () => void;
} {
	const [ newRowId, setNewRowId ] = useState< string | null >( null );
	const seenRuns = useRef( finishedRuns );
	const baselineTopId = useRef< string | null | undefined >( undefined );

	useEffect( () => {
		if ( finishedRuns !== seenRuns.current ) {
			seenRuns.current = finishedRuns;
			baselineTopId.current = isReady ? topBackupId : undefined;
		}
	}, [ finishedRuns, topBackupId, isReady ] );

	// A run that ended with no new backup leaves the baseline in place until one lands.
	useEffect( () => {
		if ( baselineTopId.current === undefined || ! isReady ) {
			return;
		}
		if ( topBackupId !== null && topBackupId !== baselineTopId.current ) {
			baselineTopId.current = undefined;
			setNewRowId( topBackupId );
		}
	}, [ topBackupId, isReady ] );

	useEffect( () => {
		if ( ! isReady ) {
			setNewRowId( null );
		}
	}, [ isReady ] );

	const clearNewRow = useCallback( () => setNewRowId( null ), [] );

	return { newRowId, clearNewRow };
}
