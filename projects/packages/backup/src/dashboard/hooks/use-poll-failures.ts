import { useEffect, useState } from '@wordpress/element';

/** Consecutive failed polls before the screen says it is reconnecting. */
export const RECONNECT_AFTER_FAILURES = 3;

/**
 * Count consecutive failed polls of one status query.
 *
 * @param errorUpdatedAt - The query's `errorUpdatedAt`; 0 when it never failed.
 * @param dataUpdatedAt  - The query's `dataUpdatedAt`; a change means a poll succeeded.
 * @return Failures since the last success.
 */
export function usePollFailures( errorUpdatedAt: number, dataUpdatedAt: number ): number {
	const [ failures, setFailures ] = useState( 0 );
	// Do not reorder: the reset must run after the increment on mount.
	useEffect( () => {
		setFailures( count => ( errorUpdatedAt === 0 ? 0 : count + 1 ) );
	}, [ errorUpdatedAt ] );
	useEffect( () => setFailures( 0 ), [ dataUpdatedAt ] );
	return failures;
}
