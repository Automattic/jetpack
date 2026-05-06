import { hashRenderItems, type RenderItem } from '../../utils/render-messages';
import type { RenderedMessageBatch, SocialStoreState } from '../types';

/**
 * Compute the cache slot key for a given (postId, items) batch.
 *
 * @param postId - Post being previewed.
 * @param items  - The render items.
 * @return Cache key string.
 */
function cacheKeyFor( postId: number, items: RenderItem[] ): string {
	return `${ postId }|${ hashRenderItems( items ) }`;
}

/**
 * The whole batch for a given (postId, items). Pairs with the
 * `getRenderedMessages` resolver, which fires the POST on first read with these
 * args and stores the response under the same cache key.
 *
 * @param state  - State object.
 * @param postId - Post being previewed.
 * @param items  - The render items.
 * @return The batch (id → result), or undefined if the resolver hasn't filled it yet.
 */
export function getRenderedMessages(
	state: SocialStoreState,
	postId: number,
	items: RenderItem[]
): RenderedMessageBatch | undefined {
	return getCachedRenderedMessages( state, postId, items );
}

/**
 * Read the rendered-messages cache without triggering the resolver.
 *
 * Use this selector in UI consumers that should not initiate network fetches.
 *
 * @param state  - State object.
 * @param postId - Post being previewed.
 * @param items  - The render items.
 * @return The cached batch (id → result), or undefined if absent.
 */
export function getCachedRenderedMessages(
	state: SocialStoreState,
	postId: number,
	items: RenderItem[]
): RenderedMessageBatch | undefined {
	if ( ! postId || items.length === 0 ) {
		return undefined;
	}
	return state.renderedMessages?.[ cacheKeyFor( postId, items ) ];
}
