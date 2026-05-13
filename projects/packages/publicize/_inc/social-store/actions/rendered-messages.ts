import {
	renderMessagesCacheKey,
	type RenderItem,
	type RenderPostIntent,
} from '../../utils/render-messages';
import {
	FINISH_RENDERING_MESSAGES,
	RECEIVE_RENDERED_MESSAGES,
	START_RENDERING_MESSAGES,
} from './constants';
import type { RenderedMessageBatch } from '../types';

/**
 * Mark a (postId, items) batch as in-flight. Dispatched by the resolver before
 * the apiFetch fires. Any prior `items` are preserved so the consumer can keep
 * showing the previous render while the new one resolves.
 *
 * @param postId     - Post being previewed.
 * @param items      - The render items.
 * @param postIntent - Edited post fields being rendered.
 * @return Action object.
 */
export function startRenderingMessages(
	postId: number,
	items: RenderItem[],
	postIntent: RenderPostIntent = {}
) {
	return {
		type: START_RENDERING_MESSAGES,
		cacheKey: renderMessagesCacheKey( postId, items, postIntent ),
	} as const;
}

/**
 * Store the rendered batch for a given (postId, items) cache key. Implicitly
 * clears the loading flag for that key.
 *
 * @param postId     - Post being previewed.
 * @param items      - The render items.
 * @param batch      - Map of connection_id → result for this batch.
 * @param postIntent - Edited post fields being rendered.
 * @return Action object.
 */
export function receiveRenderedMessages(
	postId: number,
	items: RenderItem[],
	batch: RenderedMessageBatch,
	postIntent: RenderPostIntent = {}
) {
	return {
		type: RECEIVE_RENDERED_MESSAGES,
		cacheKey: renderMessagesCacheKey( postId, items, postIntent ),
		batch,
	} as const;
}

/**
 * Clear the loading flag for a (postId, items) batch without touching `items`.
 * Used in the resolver's error path so the consumer keeps whatever it had
 * (preserves the "no flash on failure" behavior).
 *
 * @param postId     - Post being previewed.
 * @param items      - The render items.
 * @param postIntent - Edited post fields being rendered.
 * @return Action object.
 */
export function finishRenderingMessages(
	postId: number,
	items: RenderItem[],
	postIntent: RenderPostIntent = {}
) {
	return {
		type: FINISH_RENDERING_MESSAGES,
		cacheKey: renderMessagesCacheKey( postId, items, postIntent ),
	} as const;
}
