import { RECEIVE_RENDERED_MESSAGES } from './constants';
import type { RenderedMessageBatch } from '../types';

/**
 * Store the rendered batch for a given (post, items-hash) cache key.
 *
 * @param cacheKey - `${postId}|${hashRenderItems(items)}` — cache slot.
 * @param batch    - Map of connection_id → result for this batch.
 * @return Action object.
 */
export function receiveRenderedMessages( cacheKey: string, batch: RenderedMessageBatch ) {
	return {
		type: RECEIVE_RENDERED_MESSAGES,
		cacheKey,
		batch,
	} as const;
}
