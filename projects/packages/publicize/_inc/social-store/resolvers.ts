import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import {
	type RenderItem,
	type RenderPostIntent,
	type RenderResult,
} from '../utils/render-messages';
import { normalizeShareStatus } from '../utils/share-status';
import { fetchConnections, setConnections } from './actions/connection-data';
import {
	finishRenderingMessages,
	receiveRenderedMessages,
	startRenderingMessages,
} from './actions/rendered-messages';
import { fetchPostShareStatus, receivePostShareStaus } from './actions/share-status';
import {
	fetchTrafficReferrers,
	receiveTrafficReferrers,
	receiveTrafficReferrersError,
} from './actions/traffic-stats';
import {
	PostShareStatus,
	RenderedMessageBatch,
	TrafficInterval,
	TrafficReferrerDay,
} from './types';

/**
 * Resolves the connections from the post.
 *
 * @return {Function} Resolver
 */
export function getConnections() {
	return async function ( { dispatch, registry } ) {
		const editor = registry.select( editorStore );

		// In the editor, seed the list from the post meta for a fast initial
		// paint before the server fetch below merges in fresh test results.
		if ( editor.getCurrentPostId() ) {
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
			if ( Array.isArray( connections ) ) {
				dispatch( setConnections( connections ) );
			} else {
				// eslint-disable-next-line no-console
				console.error( 'Invalid connections data received from the post meta.', connections );
			}
		}

		// Fetch fresh connections (with test results) from the server.
		await dispatch( fetchConnections( { test_connections: 1 } ) );
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
 * @param  postId     - Post being previewed.
 * @param  items      - The render items.
 * @param  postIntent - Edited post fields being rendered.
 *
 * @return {Function} Resolver
 */
export function getRenderedMessages(
	postId: number,
	items: RenderItem[],
	postIntent: RenderPostIntent = {}
) {
	return async ( { dispatch } ) => {
		if ( ! postId || items.length === 0 ) {
			return;
		}

		dispatch( startRenderingMessages( postId, items, postIntent ) );

		try {
			const records = await apiFetch< RenderResult[] >( {
				path: '/wpcom/v2/publicize/render-messages',
				method: 'POST',
				data: { post_id: postId, items, post_intent: postIntent },
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
				batch[ record.connection_id ] = slot;
			}

			dispatch( receiveRenderedMessages( postId, items, batch, postIntent ) );
		} catch {
			// Keep the previous batch on error — clear loading without overwriting
			// items so the consumer keeps showing whatever it had.
			dispatch( finishRenderingMessages( postId, items, postIntent ) );
		}
	};
}

type ReferrersResponse = {
	days?: Record< string, TrafficReferrerDay >;
};

// Cap on referrers returned per day. The endpoint ranks referrers by
// volume, so a small cap can push social hosts below the cut on sites
// dominated by search/direct traffic. Keep it generous so social rows
// survive the truncation.
const MAX_REFERRERS = 100;

/**
 * Resolver for `getTrafficReferrers`. Reads the existing WPCOM stats
 * `referrers` data and stores the per-day rows under the requested
 * interval.
 *
 * The Jetpack-site route is registered with the real blog ID baked into
 * its path (see `Automattic\Jetpack\Stats_Admin\REST_Controller`), so we
 * must send the actual ID — a `0` placeholder matches no route and 404s.
 * Simple sites read the same payload through the public `/rest/v1.1`
 * namespace instead. Mirrors the path-building in the membership-products
 * store resolver.
 *
 * @param interval - Number of days the chart should cover.
 * @return Resolver thunk.
 */
export function getTrafficReferrers( interval: TrafficInterval = 30 ) {
	return async ( { dispatch } ) => {
		dispatch( fetchTrafficReferrers( interval ) );

		const blogId = getScriptData()?.site?.wpcom?.blog_id;
		if ( ! blogId ) {
			dispatch( receiveTrafficReferrersError( interval ) );
			return;
		}

		const base = isSimpleSite() ? '/rest/v1.1/sites' : '/jetpack/v4/stats-app/sites';
		try {
			const result = await apiFetch< ReferrersResponse >( {
				path: `${ base }/${ blogId }/stats/referrers?period=day&num=${ interval }&max=${ MAX_REFERRERS }`,
			} );
			dispatch( receiveTrafficReferrers( interval, result?.days ?? {} ) );
		} catch {
			dispatch( receiveTrafficReferrersError( interval ) );
		}
	};
}

export default {
	getConnections,
	getPostShareStatus,
	getRenderedMessages,
	getTrafficReferrers,
};
