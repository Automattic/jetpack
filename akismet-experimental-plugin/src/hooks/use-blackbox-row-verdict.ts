/**
 * `useBlackboxRowVerdict` — per-session Blackbox verdict for the row
 * drawer. Drawer-only — the hook short-circuits via `enabled` when no
 * session id is present so we never hit the endpoint for non-Blackbox
 * rows (comment-spam rows without a `_blackbox_session_id` meta).
 */
import { useQuery } from '@tanstack/react-query';
import { blackboxVerdictQuery } from '@/data/queries';

/**
 * Fetch the Blackbox verdict for one row's session id.
 *
 * @param sessionId - `row.visitor_id`. May be null / undefined when the
 *                  row has no associated Blackbox session.
 * @return TanStack query result for `BlackboxVerdict`.
 */
export function useBlackboxRowVerdict( sessionId: string | undefined | null ) {
	return useQuery( {
		...blackboxVerdictQuery( sessionId ?? '' ),
		enabled: !! sessionId,
	} );
}
