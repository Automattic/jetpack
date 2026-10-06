import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ApiError } from '../data/api/_helpers';
import { enqueueBackup, fetchBackups, type RawBackupEntry } from '../data/api/backups';
import { normalizeBackups } from '../data/normalize/backups';
import { keys } from '../data/query-client';

export type EnqueueState = 'idle' | 'enqueuing' | 'enqueued' | 'error';

// Shared through the query cache so the status banner, which is not a child of the button, can see the click.
// Holds the newest backup id known at click time, or false when nothing is pending.
const REQUESTED_KEY = [ 'backup', 'enqueue-requested' ] as const;

type Requested = false | { baselineId: string | null };

/**
 * The newest backup id in the backups read, or null when there is none.
 *
 * @param data - Raw backups response.
 * @return The newest id, as a string.
 */
function newestBackupId( data: RawBackupEntry[] | null | undefined ): string | null {
	return normalizeBackups( Array.isArray( data ) ? data : undefined )[ 0 ]?.id ?? null;
}

/**
 * Whether a backup was requested and WPCOM has not reported it yet.
 *
 * True from the click until the backups read shows a running backup or a
 * newer one than at click time. It reads the query data, not the button,
 * so a backup that finishes between polls, or a button that unmounted,
 * cannot leave it stuck.
 *
 * @return True while a requested backup is not yet reported.
 */
export function useBackupRequested(): boolean {
	const { data: requested } = useQuery( {
		queryKey: REQUESTED_KEY,
		queryFn: (): Requested => false,
		enabled: false,
		initialData: false as Requested,
	} );
	const { data: backups } = useQuery( {
		queryKey: keys.backups(),
		queryFn: fetchBackups,
		enabled: false,
	} );

	if ( ! requested ) {
		return false;
	}
	const newest = newestBackupId( backups );
	return newest === null || newest === requested.baselineId;
}

type Result = {
	state: EnqueueState;
	/** User-facing reason the enqueue failed, or null. */
	errorMessage: string | null;
	enqueue: () => void;
	reset: () => void;
};

/**
 * React Query mutation that asks WPCOM to run a backup now.
 *
 * `POST /jetpack/v4/site/backup/enqueue` reports failure in three
 * different ways and only one of them is an HTTP error, so the success
 * path is validated rather than assumed. A rejected request (no
 * permission, network, an unreachable WordPress.com, an expired nonce)
 * throws. A 200 whose body will not decode is flattened by PHP into HTTP
 * 200 with a `null` body, which resolves. And WPCOM can answer 200 with
 * `{ success: false, error }`.
 *
 * The legacy button checks only the first — it clears its busy state on
 * a rejection but discards the body — so it still reports "Backup
 * enqueued" for the other two, then polls for a backup that will never
 * arrive.
 *
 * @return Enqueue state and controls.
 */
export function useEnqueueBackup(): Result {
	const queryClient = useQueryClient();

	const mutation = useMutation( {
		onMutate: () => {
			const requested: Requested = {
				baselineId: newestBackupId( queryClient.getQueryData( keys.backups() ) ),
			};
			queryClient.setQueryData( REQUESTED_KEY, requested );
		},
		onError: () => {
			queryClient.setQueryData( REQUESTED_KEY, false );
		},
		mutationFn: async () => {
			const result = await enqueueBackup();
			if ( result === null ) {
				throw new ApiError(
					'backup_enqueue_failed',
					__( 'Could not start a backup. Please try again.', 'jetpack-backup-pkg' )
				);
			}
			if ( result.success === false ) {
				throw new ApiError(
					'backup_enqueue_failed',
					result.error || __( 'Could not start a backup. Please try again.', 'jetpack-backup-pkg' )
				);
			}
			return result;
		},
		// Awaited before the mutation settles, so the button never reports
		// "enqueued" while the list it polls is still the stale one.
		onSuccess: () => queryClient.invalidateQueries( { queryKey: keys.backups() } ),
	} );

	const { mutate, reset: resetMutation, isPending, isError, isSuccess, error } = mutation;

	const enqueue = useCallback( () => {
		mutate();
	}, [ mutate ] );

	const reset = useCallback( () => {
		resetMutation();
		queryClient.setQueryData( REQUESTED_KEY, false );
	}, [ resetMutation, queryClient ] );

	let state: EnqueueState = 'idle';
	if ( isPending ) {
		state = 'enqueuing';
	} else if ( isError ) {
		state = 'error';
	} else if ( isSuccess ) {
		state = 'enqueued';
	}

	return {
		state,
		errorMessage: isError ? ( error?.message ?? null ) : null,
		enqueue,
		reset,
	};
}
