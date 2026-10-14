/**
 * External dependencies
 */
import { createStore, applyMiddleware } from 'redux';
import { call, put, takeLatest, delay } from 'redux-saga/effects';
import createSagaMiddleware from 'redux-saga';
import { set } from 'lodash';

/**
 * WordPress dependencies
 */
import { register, select } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import { getBlockQueries, sanitizePostList, recursivelyGetBlocks } from './utils';

const { name } = metadata;
export const STORE_NAMESPACE = `newspack-blocks/${ name }`;

const initialState = {
	// Map of returned posts to block clientIds.
	postsByBlock: {},
	errorsByBlock: {},
};

// Generic redux action creators, not @wordpress/data actions.
const actions = {
	reflow: () => {
		reduxStore.dispatch( {
			type: 'REFLOW',
		} );
	},
};

// Generic redux selectors, not @wordpress/data selectors.
const selectors = {
	getPosts( { clientId } ) {
		return reduxStore.getState().postsByBlock[ clientId ];
	},
	getError( { clientId } ) {
		return reduxStore.getState().errorsByBlock[ clientId ];
	},
	isUIDisabled() {
		return reduxStore.getState().isUIDisabled;
	},
};

const reducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'DISABLE_UI':
			return set( state, 'isUIDisabled', true );
		case 'ENABLE_UI':
			return set( state, 'isUIDisabled', false );
		case 'UPDATE_BLOCK_POSTS':
			return set( state, [ 'postsByBlock', action.clientId ], action.posts );
		case 'UPDATE_BLOCK_ERROR':
			return set( state, [ 'errorsByBlock', action.clientId ], action.error );
	}
	return state;
};

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();
// mount it on the Store
const reduxStore = createStore( reducer, applyMiddleware( sagaMiddleware ) );

const genericStore = {
	getSelectors() {
		return selectors;
	},
	getActions() {
		return actions;
	},
	...reduxStore,
};

/**
 * A cache for posts queries.
 */
const POSTS_QUERIES_CACHE = {};
const createCacheKey = JSON.stringify;

/**
 * The query a block's posts are cached under. A deduplicating block's result depends on
 * the posts shown above it, so the exclusion list is part of its key.
 *
 * @param {Object} block   an object with a postsQuery and a deduplicate flag
 * @param {Array}  exclude IDs of posts already shown above the block
 * @return {Object} posts query
 */
const effectiveQuery = ( block, exclude ) => ( block.deduplicate ? { ...block.postsQuery, exclude } : block.postsQuery );

/**
 * Fetch posts for blocks in document order, carrying the exclusion list from each
 * deduplicating block to the next.
 *
 * Blocks answered from the cache are dispatched without a request. From the first block
 * that isn't cached, the rest go to the batch endpoint, which applies the exclusion list
 * server-side, so a page costs one request instead of one per block. When only one block
 * needs posts, it uses the single-block endpoint instead.
 *
 * @yield
 * @param {Array} blockQueries objects with clientId, postsQuery and deduplicate, in document order
 * @param {Array} exclude      IDs of posts to exclude from the first deduplicating block
 */
export function* fetchPostsForBlocks( blockQueries, exclude ) {
	const { posts_rest_url: singleUrl, posts_batch_rest_url: url } = window.newspack_blocks_data;
	// Localized as a string, and the server enforces its own limit either way.
	const maxQueries = Number( window.newspack_blocks_data.posts_batch_max_queries );
	const pending = [ ...blockQueries ];

	const showPosts = function* ( block, posts ) {
		POSTS_QUERIES_CACHE[ createCacheKey( effectiveQuery( block, exclude ) ) ] = posts;
		yield put( { type: 'UPDATE_BLOCK_POSTS', clientId: block.clientId, posts } );
		if ( block.deduplicate ) {
			exclude = [ ...exclude, ...posts.map( post => post.id ) ];
		}
	};

	while ( pending.length ) {
		const cached = POSTS_QUERIES_CACHE[ createCacheKey( effectiveQuery( pending[ 0 ], exclude ) ) ];
		if ( cached !== undefined ) {
			yield* showPosts( pending.shift(), cached );
			continue;
		}

		const batch = pending.splice( 0, maxQueries );

		if ( batch.length === 1 ) {
			const [ block ] = batch;
			try {
				const posts = yield call( apiFetch, {
					// `context=edit` is needed, so that custom REST fields are returned.
					url: addQueryArgs( singleUrl, { ...effectiveQuery( block, exclude ), context: 'edit' } ),
				} );
				yield* showPosts( block, posts );
			} catch ( e ) {
				// A failed block adds nothing to the exclusion list, so later blocks can still load.
				yield put( { type: 'UPDATE_BLOCK_ERROR', clientId: block.clientId, error: e.message } );
			}
			continue;
		}

		let results;
		try {
			results = yield call( apiFetch, {
				url,
				method: 'POST',
				data: {
					exclude,
					queries: batch.map( ( { clientId, postsQuery, deduplicate } ) => ( {
						clientId,
						// `context=edit` is needed, so that custom REST fields are returned.
						postsQuery: { ...postsQuery, context: 'edit' },
						deduplicate,
					} ) ),
				},
			} );
		} catch ( e ) {
			// Without this batch's posts the exclusion list for later blocks is unknown.
			for ( const block of [ ...batch, ...pending ] ) {
				yield put( { type: 'UPDATE_BLOCK_ERROR', clientId: block.clientId, error: e.message } );
			}
			return;
		}

		const resultsByClientId = Object.fromEntries( results.map( result => [ result.clientId, result ] ) );
		for ( const block of batch ) {
			const result = resultsByClientId[ block.clientId ];
			if ( result?.posts ) {
				yield* showPosts( block, result.posts );
			} else {
				yield put( {
					type: 'UPDATE_BLOCK_ERROR',
					clientId: block.clientId,
					error: result?.error || __( 'The posts for this block could not be loaded.', 'jetpack-mu-wpcom' ),
				} );
			}
		}
	}
}

/**
 * Whether a block uses deduplication.
 *
 * @param {string} clientId
 *
 * @return {boolean} whether the block uses deduplication
 */
function shouldDeduplicate( clientId ) {
	const { getBlock } = select( 'core/block-editor' );
	const block = getBlock( clientId );
	return block?.attributes?.deduplicate;
}

const createFetchPostsSaga = blockNames => {
	/**
	 * "worker" Saga: will be fired on REFLOW actions
	 *
	 * @yield
	 */
	function* fetchPosts() {
		// debounce by 300ms
		yield delay( 300 );

		const { getBlocks } = select( 'core/block-editor' );
		const { getCurrentPostId } = select( 'core/editor' );

		yield put( { type: 'DISABLE_UI' } );

		const blocks = recursivelyGetBlocks( getBlocks );

		const blockQueries = getBlockQueries( blocks, blockNames ).map( block => ( {
			...block,
			deduplicate: Boolean( shouldDeduplicate( block.clientId ) ),
		} ) );

		// Use requested specific posts ids as the starting state of exclusion list.
		const specificPostsId = blockQueries.reduce( ( acc, { deduplicate, postsQuery } ) => {
			if ( deduplicate && postsQuery.include ) {
				acc = [ ...acc, ...postsQuery.include ];
			}
			return acc;
		}, [] );

		yield call( fetchPostsForBlocks, blockQueries, sanitizePostList( [ ...specificPostsId, getCurrentPostId() ] ) );

		yield put( { type: 'ENABLE_UI' } );
	}

	/**
	 * Starts fetchPosts on each dispatched `REFLOW` action.
	 *
	 * fetchPosts will wait 300ms before fetching. Thanks to takeLatest,
	 * if new reflow happens during this time, the reflow from before
	 * will be cancelled.
	 *
	 * @yield
	 */
	return function* fetchPostsSaga() {
		yield takeLatest( 'REFLOW', fetchPosts );
	};
};

export const registerQueryStore = blockNames => {
	register( { name: STORE_NAMESPACE, instantiate: () => genericStore } );

	// Run the saga ✨
	sagaMiddleware.run( createFetchPostsSaga( blockNames ) );
};
