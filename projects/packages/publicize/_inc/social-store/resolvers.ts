import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { type RenderItem, type RenderResult } from '../utils/render-messages';
import { normalizeShareStatus } from '../utils/share-status';
import { setConnections } from './actions/connection-data';
import {
	finishRenderingMessages,
	receiveRenderedMessages,
	startRenderingMessages,
} from './actions/rendered-messages';
import { fetchPostShareStatus, receivePostShareStaus } from './actions/share-status';
import { PostShareStatus, RenderedMessageBatch } from './types';

/**
 * Resolves the connections from the post.
 *
 * @return {Function} Resolver
 */
export function getConnections() {
	return function ( { dispatch, registry } ) {
		const editor = registry.select( editorStore );
		if ( ! editor.getCurrentPostId() ) {
			return;
		}
		// Get the initial connections from the post meta
		const connections = editor.getEditedPostAttribute( 'jetpack_publicize_connections' );

		/**
		 * If by any chance the REST meta validation fails,
		 * the value can be in the following format:
		 *
		 * {
		 * "errors": { "rest_invalid_type": [] },
		 * "error_data": { "rest_invalid_type": { "param": "" } }
		 * }
		 *
		 * It's because of https://github.com/Automattic/jetpack/blob/42a62f9821d4d5c89866e09813eafaad7648d243/projects/packages/publicize/src/class-connections-post-field.php#L224-L228
		 *
		 * So, we need to check if the value is actually an array or not.
		 */
		if ( ! Array.isArray( connections ) ) {
			// eslint-disable-next-line no-console
			console.error( 'Invalid connections data received from the post meta.', connections );
			return;
		}

		dispatch( setConnections( connections || [] ) );
	};
}

/**
 * Resolves the post share status.
 *
 * @param {number} _postId - The post ID.
 *
 * @return {Function} Resolver
 */
export function getPostShareStatus( _postId ) {
	return async ( { dispatch, registry } ) => {
		// Default to the current post ID if none is provided.
		const postId = _postId || registry.select( editorStore ).getCurrentPostId();

		try {
			dispatch( fetchPostShareStatus( postId ) );
			let result = await apiFetch< PostShareStatus >( {
				path: `/wpcom/v2/publicize/share-status?post_id=${ postId }`,
			} );

			result = normalizeShareStatus( result );

			dispatch( receivePostShareStaus( result, postId ) );
		} catch {
			dispatch( fetchPostShareStatus( postId, false ) );
		}
	};
}

/**
 * Resolver for `getRenderedMessages`. Fires a single POST per unique
 * `(postId, items)` combination. WP data dedupes by selector args, so multiple
 * `useConnectionPreviewData` consumers reading the same args share one fetch.
 *
 * Failures are swallowed so the consumer keeps showing whatever it had — same
 * "don't flash on error" behavior the per-network hook used to provide.
 *
 * @param  postId - Post being previewed.
 * @param  items  - The render items.
 *
 * @return {Function} Resolver
 */
export function getRenderedMessages( postId: number, items: RenderItem[] ) {
	return async ( { dispatch } ) => {
		if ( ! postId || items.length === 0 ) {
			return;
		}

		dispatch( startRenderingMessages( postId, items ) );

		try {
			const records = await apiFetch< RenderResult[] >( {
				path: '/wpcom/v2/publicize/render-messages',
				method: 'POST',
				data: { post_id: postId, items },
			} );

			const batch: RenderedMessageBatch = {};
			for ( const record of records ?? [] ) {
				const slot: RenderedMessageBatch[ string ] = {};
				if ( typeof record.rendered_message === 'string' ) {
					slot.rendered_message = record.rendered_message;
				}
				if ( record.error ) {
					slot.error = record.error;
				}
				batch[ record.id ] = slot;
			}

			dispatch( receiveRenderedMessages( postId, items, batch ) );
		} catch {
			// Keep the previous batch on error — clear loading without overwriting
			// items so the consumer keeps showing whatever it had.
			dispatch( finishRenderingMessages( postId, items ) );
		}
	};
}

export default {
	getConnections,
	getPostShareStatus,
	getRenderedMessages,
};
