/**
 * Shared playlist-order resolution helpers.
 *
 * `vps_playlist_order` term meta is presentation-only and can drift from the
 * real term relationships (videos removed from the playlist, or added without
 * an order write). These helpers reconcile the stored order with the actual
 * members so every consumer self-heals the same way. They are shared by the
 * dashboard playlist screens and the playlist block editor preview, so they
 * live outside the dashboard tree and must stay dependency-free (no
 * react-query, no REST types). A PHP twin lives in
 * src/class-playlist-block.php (resolve_ordered_ids) — keep the semantics in
 * lockstep or the editor preview and the frontend render will disagree.
 */

/**
 * Drop stale entries from a stored order list and append members it misses.
 *
 * Order entries whose ID is no longer a member are dropped, members absent
 * from the order are appended in the sequence `memberIds` arrives in (the
 * dashboard fetch orders by date, so appends are stable by date), and
 * duplicates keep their first position.
 *
 * @param order     - The stored `vps_playlist_order` attachment IDs.
 * @param memberIds - IDs of the attachments actually carrying the term.
 * @return The reconciled, fully-covering ordered ID list.
 */
export function resolveOrderedIds( order: number[], memberIds: number[] ): number[] {
	const members = new Set( memberIds );
	const seen = new Set< number >();
	const ordered: number[] = [];
	for ( const id of [ ...order, ...memberIds ] ) {
		if ( members.has( id ) && ! seen.has( id ) ) {
			ordered.push( id );
			seen.add( id );
		}
	}
	return ordered;
}

/**
 * Apply a stored order to the fetched members: reconcile the ID lists with
 * resolveOrderedIds(), then materialize the videos in that sequence.
 *
 * @param videos - The fetched playlist members.
 * @param order  - The stored `vps_playlist_order` attachment IDs.
 * @return The members sorted for display.
 */
export function orderPlaylistVideos< T extends { id: number } >(
	videos: T[],
	order: number[]
): T[] {
	const byId = new Map( videos.map( video => [ video.id, video ] ) );
	return resolveOrderedIds(
		order,
		videos.map( video => video.id )
	).map( id => byId.get( id ) as T );
}
