/**
 * Render-messages types + cache-key hashing.
 *
 * The `wpcom/v2/publicize/render-messages` endpoint is POST with a JSON body
 * (see `Render_Messages_Controller`), and the response is cached client-side in
 * the `renderedMessages` social-store slice keyed by `${postId}|${hashRenderItems(items)}`.
 * Each unique render-input batch gets its own cache slot, so reverting to a
 * previously-seen items shape reads back the cached response without refetching
 * and without the stale-content collisions that core-data's entity-records cache
 * would have produced (records there merge by id across queries, which is wrong
 * for content that depends on query inputs).
 */

export type RenderItem = {
	id: string;
	network: string;
	message?: string;
	is_social_post?: boolean;
};

export type RenderResult = {
	id: string;
	rendered_message?: string;
	error?: { code: string; message: string };
};

/**
 * Stable hash of the items array — used as the cache key in the rendered-messages
 * store slice so each unique render-input batch gets its own slot.
 *
 * @param items - The render items being sent to the server.
 * @return A stable string fingerprint of the items array.
 */
export function hashRenderItems( items: RenderItem[] ): string {
	return JSON.stringify(
		items.map( i => [ i.id, i.network, i.message ?? '', Boolean( i.is_social_post ) ] )
	);
}
