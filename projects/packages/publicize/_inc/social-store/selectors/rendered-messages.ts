import { createRegistrySelector } from '@wordpress/data';
import { hashRenderItems, type RenderItem } from '../../utils/render-messages';
import type { RenderedMessageBatch, SocialStoreState } from '../types';

const STORE_ID = 'jetpack-social-plugin';

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
 * `getRenderedMessages` resolver, which fires the POST on first read with
 * these args and stores the response under the same cache key.
 *
 * Reading this selector is what triggers the fetch — consumers that only need
 * one connection's slice should call {@link getRenderedMessageForConnection},
 * which routes through this selector so the resolver still fires.
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
	if ( ! postId || items.length === 0 ) {
		return undefined;
	}
	return state.renderedMessages?.[ cacheKeyFor( postId, items ) ];
}

/**
 * Pull a single connection's rendered slice from the current batch. Calls
 * `getRenderedMessages` via the registry, which is what triggers the
 * resolver — so reading this selector from a `useSelect` is enough to drive
 * the fetch.
 *
 * @param postId       - Post being previewed.
 * @param items        - All items in the batch — used as the cache key.
 * @param connectionId - Which connection's slice to read.
 * @return The slice for this connection, or null if the batch hasn't resolved yet.
 */
export const getRenderedMessageForConnection = createRegistrySelector(
	select =>
		(
			_state: unknown,
			postId: number,
			items: RenderItem[],
			connectionId: string
		): RenderedMessageBatch[ string ] | null => {
			const batch = select( STORE_ID ).getRenderedMessages( postId, items ) as
				| RenderedMessageBatch
				| undefined;
			return batch?.[ connectionId ] ?? null;
		}
);
