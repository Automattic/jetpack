import { renderMessagesCacheKey, type RenderItem } from '../../utils/render-messages';
import type { RenderedMessageBatch, SocialStoreState } from '../types';

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
	return state.renderedMessages?.[ renderMessagesCacheKey( postId, items ) ]?.items;
}

/**
 * Whether the batch for these items is currently being fetched. Returns true
 * either when the resolver has explicitly marked the slot loading, or when no
 * entry exists yet — that "no entry yet" window covers the gap between an
 * items-array commit and the resolver dispatching `start`, so the preview
 * doesn't flash the raw baseMessage in between.
 *
 * The resolver's `finish` action keeps the entry around with `isLoading: false`
 * on error, so the failure path still falls back to baseMessage cleanly.
 *
 * @param state  - State object.
 * @param postId - Post being previewed.
 * @param items  - The render items.
 * @return Loading flag for the matching cache slot.
 */
export function isLoadingRenderedMessages(
	state: SocialStoreState,
	postId: number,
	items: RenderItem[]
): boolean {
	if ( ! postId || items.length === 0 ) {
		return false;
	}
	const entry = state.renderedMessages?.[ renderMessagesCacheKey( postId, items ) ];
	return entry === undefined || entry.isLoading;
}
