/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { markResponseAsRead } from '../inbox/mark-as-read';
import type { FormResponse } from '../../types';
import type { DispatchActions } from '../inbox/stage/types';

/**
 * Marks a feedback response as read the first time it is viewed, keeping the admin-menu unread counter in sync. No-ops for read or absent responses and marks each response at most once.
 *
 * The guard is a ref rather than state so it also blocks React's synchronous double-invoke of effects (StrictMode/dev): a second `/read` request would otherwise recalculate the count on an already-read response and could clobber the badge with a stale value.
 *
 * The id is latched even for responses that were already read when opened, so that a subsequent manual "Mark as unread" on the open response is not immediately undone: the flip to `is_unread` re-runs the effect, but the same-id guard now short-circuits it instead of re-marking the response as read.
 *
 * @param response  - The response currently being viewed, or null while loading.
 * @param onSuccess - Optional callback run after the server confirms the read (e.g. to refresh list/tab counts); memoize it to avoid unnecessary effect churn.
 */
export default function useMarkAsReadOnView(
	response: FormResponse | null | undefined,
	onSuccess?: ( responseId: number ) => void
): void {
	const lastMarkedId = useRef< number | null >( null );
	const { editEntityRecord } = useDispatch( coreStore ) as unknown as DispatchActions;

	useEffect( () => {
		// No response to act on yet (still loading) — don't latch anything.
		if ( ! response || ! response.id ) {
			return;
		}
		// Already handled this response — don't re-mark it. This also covers the
		// already-read-then-manually-unread case, since the id was latched below.
		if ( lastMarkedId.current === response.id ) {
			return;
		}

		lastMarkedId.current = response.id;

		// Already read when opened — latch the id (above) but issue no request.
		if ( ! response.is_unread ) {
			return;
		}

		markResponseAsRead( response, editEntityRecord, onSuccess );
	}, [ response, editEntityRecord, onSuccess ] );
}
