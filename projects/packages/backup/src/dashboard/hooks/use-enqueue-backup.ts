import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ApiError } from '../data/api/_helpers';
import { enqueueBackup, fetchBackups, type RawBackupEntry } from '../data/api/backups';
import { normalizeBackups } from '../data/normalize/backups';
import { keys } from '../data/query-client';

export type EnqueueState = 'idle' | 'enqueuing' | 'enqueued' | 'error';

/** How long a request may wait for WPCOM to report a backup before the UI gives up. */
export const REQUEST_CEILING_MS = 10 * 60_000;

const ENQUEUE_KEY = [ 'backup', 'enqueue' ] as const;

// Shared through the query cache so components outside the button can see the click.
type Requested =
	| false
	| {
			clickedAt: number;
			/** False until the fresh pre-click read lands, so an unknown baseline never clears the request. */
			baselineReady: boolean;
			baselineId: string | null;
	  };

/**
 * The newest backup id in the backups read, or null when there is none.
 *
 * @param data - Raw backups response.
 * @return The newest id, as a string.
 */
export function newestBackupId( data: RawBackupEntry[] | null | undefined ): string | null {
	return normalizeBackups( Array.isArray( data ) ? data : undefined )[ 0 ]?.id ?? null;
}

/**
 * Whether a backup was requested and WPCOM has not reported it yet.
 *
 * Gotcha: this reads the query cache, not the button, and `useBackups` polls while it is true.
 *
 * @return True while a requested backup is not yet reported.
 */
export function useBackupRequested(): boolean {
	const queryClient = useQueryClient();
	const { data: requested } = useQuery( {
		queryKey: keys.enqueueRequested(),
		queryFn: (): Requested => false,
		enabled: false,
		initialData: false as Requested,
	} );
	const { data: backups } = useQuery( {
		queryKey: keys.backups(),
		queryFn: fetchBackups,
		enabled: false,
	} );

	const clickedAt = requested ? requested.clickedAt : null;
	useEffect( () => {
		if ( clickedAt === null ) {
			return;
		}
		const timer = setTimeout(
			() => queryClient.setQueryData( keys.enqueueRequested(), false ),
			Math.max( 0, clickedAt + REQUEST_CEILING_MS - Date.now() )
		);
		return () => clearTimeout( timer );
	}, [ clickedAt, queryClient ] );

	if ( ! requested ) {
		return false;
	}
	if ( ! requested.baselineReady ) {
		return true;
	}
	const newest = newestBackupId( backups );
	return newest === null || newest === requested.baselineId;
}

type Result = {
	state: EnqueueState;
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
		mutationKey: ENQUEUE_KEY,
		// Dropped with its observer, so a failure outlives neither a retry nor the button.
		gcTime: 0,
		// The flag is set at once so the banner appears on the click. The baseline
		// comes from a fresh read taken before the POST, never from a possibly stale cache.
		onMutate: async () => {
			const clickedAt = Date.now();
			const pending: Requested = { clickedAt, baselineReady: false, baselineId: null };
			queryClient.setQueryData( keys.enqueueRequested(), pending );
			// A `null` read overwrites the cache, so take the snapshot first.
			const cached = queryClient.getQueryData< RawBackupEntry[] | null >( keys.backups() );
			let fresh: RawBackupEntry[] | null | undefined;
			try {
				fresh = await queryClient.fetchQuery( {
					queryKey: keys.backups(),
					queryFn: fetchBackups,
					staleTime: 0,
				} );
			} catch {
				fresh = undefined;
			}
			const baseline = Array.isArray( fresh ) ? fresh : cached;
			// No usable list: stay pending until the ceiling rather than guess a baseline.
			if ( ! Array.isArray( baseline ) ) {
				return;
			}
			const ready: Requested = {
				clickedAt,
				baselineReady: true,
				baselineId: newestBackupId( baseline ),
			};
			queryClient.setQueryData( keys.enqueueRequested(), ready );
		},
		onError: () => {
			queryClient.setQueryData( keys.enqueueRequested(), false );
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

	const { mutate, reset: resetMutation, isPending, isError, isSuccess } = mutation;

	const enqueue = useCallback( () => {
		mutate();
	}, [ mutate ] );

	const reset = useCallback( () => {
		resetMutation();
		queryClient.setQueryData( keys.enqueueRequested(), false );
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
		enqueue,
		reset,
	};
}

/**
 * Why the button's latest request failed, for a notice rendered outside the header.
 *
 * @return The failure, or null unless the latest request failed.
 */
export function useEnqueueFailure(): Error | null {
	const states = useMutationState( {
		filters: { mutationKey: ENQUEUE_KEY },
		select: mutation => mutation.state,
	} );
	const latest = states[ states.length - 1 ];
	return latest?.status === 'error' ? latest.error : null;
}
