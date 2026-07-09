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

/**
 * Sentinel `connection_id` used to render the global message template for the
 * manual-sharing buttons, which exist independently of any connection (they show
 * even with zero connections). The render endpoint requires each item to carry a
 * `connection_id`, so we issue a dedicated single-item render under this id with
 * the global template forced via the item's `message` override. It is the single
 * source of truth for both the request and the cache read-back.
 */
export const MANUAL_SHARE_SENTINEL = '__manual_share__';

export type RenderItem = {
	connection_id: string;
	message?: string;
	is_social_post?: boolean;
};

export type RenderPostIntent = {
	title?: string;
	excerpt?: string;
	content?: string;
};

export type RenderResult = {
	connection_id: string;
	rendered_message?: string;
	error?: { code: string; message: string };
};

/**
 * Small deterministic fingerprint for long render-input strings.
 *
 * @param value - Value to fingerprint.
 * @return Length-prefixed hash.
 */
function hashString( value: string ): string {
	let hash = 2166136261;

	for ( let i = 0; i < value.length; i++ ) {
		hash = ( Math.imul( hash, 16777619 ) + value.charCodeAt( i ) ) % 4294967291;
	}

	return `${ value.length }:${ hash.toString( 36 ) }`;
}

/**
 * Stable hash of the items array — used as the cache key in the rendered-messages
 * store slice so each unique render-input batch gets its own slot.
 *
 * @param items      - The render items being sent to the server.
 * @param postIntent - Edited post fields being sent to the server.
 * @return A stable string fingerprint of the items array.
 */
export function hashRenderItems( items: RenderItem[], postIntent: RenderPostIntent = {} ): string {
	if ( items.length === 0 && ! postIntent.title && ! postIntent.excerpt && ! postIntent.content ) {
		return '[]';
	}

	return JSON.stringify( [
		items.map( i => [ i.connection_id, i.message ?? '', Boolean( i.is_social_post ) ] ),
		postIntent.title ?? '',
		postIntent.excerpt ?? '',
		hashString( postIntent.content ?? '' ),
	] );
}

/**
 * Compute the slice cache key for a given (postId, items) batch. Shared between
 * action creators, the resolver, and selectors so they all agree on which slot
 * a request maps to.
 *
 * @param postId     - Post being previewed.
 * @param items      - The render items.
 * @param postIntent - Edited post fields being sent to the server.
 * @return Cache key string of the form `${postId}|${hashRenderItems(items)}`.
 */
export function renderMessagesCacheKey(
	postId: number,
	items: RenderItem[],
	postIntent: RenderPostIntent = {}
): string {
	return `${ postId }|${ hashRenderItems( items, postIntent ) }`;
}
