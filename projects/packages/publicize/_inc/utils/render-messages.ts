/**
 * Render-messages payload sizing + chunking.
 *
 * The `wpcom/v2/publicize/render-messages` endpoint is GET, which keeps it slottable
 * into core-data's `getEntityRecords`. The tradeoff is URL length: many connections
 * with long messages can blow past infrastructure caps (typically ~4KB safe, ~8KB
 * risky). We pre-chunk by encoded payload size so the common case stays a single
 * request, and only pay for chunking when the batch actually grows.
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

export type RenderQueryArgs = {
	post_id: number;
	items: RenderItem[];
};

/**
 * Conservative payload-size threshold (bytes of JSON-encoded items array).
 * Picked well below typical proxy/CDN URL limits to leave headroom for
 * the encoded query string overhead.
 */
export const DEFAULT_CHUNK_BYTE_BUDGET = 3000;

/**
 * Estimate the encoded byte size of an item. JSON length is a fine proxy for the
 * URL-encoded length — both grow linearly with content, and JSON is cheaper to
 * compute than running each item through the same encoder core-data uses.
 *
 * @param item - The render item to size.
 * @return Estimated byte size.
 */
function estimateItemSize( item: RenderItem ): number {
	return JSON.stringify( item ).length;
}

/**
 * Split items into chunks where each chunk's encoded payload stays under `byteBudget`.
 *
 * - Greedy bin-packing in input order, which preserves the caller's ordering inside each chunk and keeps the implementation trivial.
 * - A single oversized item is allowed to occupy its own chunk — the server still handles it, and splitting one item's render across requests isn't possible.
 *
 * @param items      - All items to render.
 * @param byteBudget - Max encoded item-payload bytes per chunk. Defaults to {@link DEFAULT_CHUNK_BYTE_BUDGET}.
 * @return Array of chunks. Always returns at least one chunk when `items` is non-empty.
 */
export function chunkRenderItems(
	items: RenderItem[],
	byteBudget: number = DEFAULT_CHUNK_BYTE_BUDGET
): RenderItem[][] {
	if ( items.length === 0 ) {
		return [];
	}

	const chunks: RenderItem[][] = [];
	let current: RenderItem[] = [];
	let currentSize = 0;

	for ( const item of items ) {
		const size = estimateItemSize( item );

		if ( current.length > 0 && currentSize + size > byteBudget ) {
			chunks.push( current );
			current = [];
			currentSize = 0;
		}

		current.push( item );
		currentSize += size;
	}

	if ( current.length > 0 ) {
		chunks.push( current );
	}

	return chunks;
}
