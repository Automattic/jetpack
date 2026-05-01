import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import {
	chunkRenderItems,
	type RenderItem,
	type RenderResult,
	type RenderQueryArgs,
} from '../../utils/render-messages';

const ENTITY_KIND = 'wpcom/v2';
const ENTITY_NAME = 'publicize/render-messages';

/**
 * Trigger resolution and collect results across all chunks for a given (postId, items)
 * call. Returns null until every chunk has resolved (so consumers can keep showing the
 * previous render and avoid mid-batch flashes), then returns a Map keyed by the input id.
 *
 * @param postId - The post being previewed.
 * @param items  - All items to render (the selector handles chunking internally).
 * @return Map of id → result, or null while any chunk is still resolving.
 */
export const getRenderedMessages = createRegistrySelector(
	select =>
		(
			_state: unknown,
			postId: number,
			items: RenderItem[]
		): Map< string, RenderResult > | null => {
			if ( ! postId || items.length === 0 ) {
				return new Map();
			}

			const chunks = chunkRenderItems( items );
			const merged = new Map< string, RenderResult >();

			for ( const chunk of chunks ) {
				const queryArgs: RenderQueryArgs = { post_id: postId, items: chunk };
				const records = select( coreStore ).getEntityRecords< RenderResult >(
					ENTITY_KIND,
					ENTITY_NAME,
					queryArgs
				);

				if ( ! records ) {
					// Any unresolved chunk means we report "not ready yet" for the whole batch.
					return null;
				}

				for ( const record of records ) {
					merged.set( record.id, record );
				}
			}

			return merged;
		}
);

/**
 * Pull a single connection's rendered slice from the batched result.
 *
 * @param state        - State (unused; supplied by the data store).
 * @param postId       - The post being previewed.
 * @param items        - All items in the batch (used to drive resolution + cache key).
 * @param connectionId - Which connection's slice to read.
 * @return The result record, or null if nothing has resolved yet for this batch.
 */
export function getRenderedMessageForConnection(
	state: unknown,
	postId: number,
	items: RenderItem[],
	connectionId: string
): RenderResult | null {
	const map = getRenderedMessages( state, postId, items );

	if ( ! map ) {
		return null;
	}

	return map.get( connectionId ) ?? null;
}

/**
 * Whether any chunk for the current batch is still being fetched.
 */
export const isFetchingRenderedMessages = createRegistrySelector(
	select =>
		( _state: unknown, postId: number, items: RenderItem[] ): boolean => {
			if ( ! postId || items.length === 0 ) {
				return false;
			}

			const { isResolving } = select( coreStore );
			const chunks = chunkRenderItems( items );

			return chunks.some( chunk =>
				isResolving( 'getEntityRecords', [
					ENTITY_KIND,
					ENTITY_NAME,
					{ post_id: postId, items: chunk },
				] )
			);
		}
);
