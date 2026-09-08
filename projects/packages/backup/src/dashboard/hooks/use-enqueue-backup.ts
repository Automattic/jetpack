import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ApiError } from '../data/api/_helpers';
import { enqueueBackup } from '../data/api/backups';
import { keys } from '../data/query-client';

export type EnqueueState = 'idle' | 'enqueuing' | 'enqueued' | 'error';

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
	}, [ resetMutation ] );

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
		errorMessage: isError ? error?.message ?? null : null,
		enqueue,
		reset,
	};
}
