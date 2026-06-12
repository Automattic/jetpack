import type { Awareness } from '@wordpress/sync';

interface CollaboratorAwarenessState {
	collaboratorInfo?: { id?: number };
}

/**
 * Build the contributor user-ID list from the current awareness states.
 *
 * A user editing in multiple tabs appears multiple times (same id); distinct
 * users appear as distinct ids. States with no collaborator id are skipped.
 *
 * The ids come from awareness `collaboratorInfo.id`, i.e. the WordPress user id.
 * On Simple sites that is the WordPress.com user id, but on Atomic/Jetpack sites
 * it is the *site-local* WP user id (not the wpcom id used by Tracks' `_ui`), so
 * `contributors` is only meaningful scoped to a single `blog_id`.
 *
 * Limitation: this roster is best-effort. A client records only the peers it has
 * synced when the snapshot fires. On HTTP-polling, awareness arrives on a poll
 * cycle (up to 25s for a backgrounded tab), so a joiner can record a self-only
 * roster even when others are editing. Derive simultaneous-editor and multi-tab
 * counts by correlating events (distinct/repeated `wp_user_id` on the same
 * `post_id` within a time window), not from a single event's `contributors`.
 *
 * @param awareness            - The Yjs awareness instance for the room.
 * @param options              - Options.
 * @param options.excludeLocal - Omit the local client's own entry (by clientID).
 *                             Used for the blocked event, where the turned-away
 *                             local user is reported via `wp_user_id`, not as a
 *                             room occupant. Other tabs of the same user remain.
 * @return The WP user IDs currently present in the room.
 */
export function getContributorIds(
	awareness: Awareness,
	options: { excludeLocal?: boolean } = {}
): number[] {
	return Array.from( awareness.getStates().entries() )
		.filter( ( [ clientId ] ) => ! options.excludeLocal || clientId !== awareness.clientID )
		.map( ( [ , state ] ) => ( state as CollaboratorAwarenessState )?.collaboratorInfo?.id )
		.filter( ( id ): id is number => typeof id === 'number' );
}

/**
 * The local client's WordPress user id, read from the local awareness state's
 * `collaboratorInfo.id` (same id-space as `contributors` — see
 * `getContributorIds`). Undefined until core-data populates it, shortly after
 * the provider is created.
 *
 * @param awareness - The Yjs awareness instance for the room.
 * @return The local client's WP user id, or undefined when not yet present.
 */
export function getLocalUserId( awareness: Awareness ): number | undefined {
	const localState = awareness.getStates().get( awareness.clientID ) as
		| CollaboratorAwarenessState
		| undefined;
	return localState?.collaboratorInfo?.id;
}
