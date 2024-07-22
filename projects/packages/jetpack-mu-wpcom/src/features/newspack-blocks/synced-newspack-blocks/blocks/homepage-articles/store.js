/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { register, select } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';
import { set } from 'lodash';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { call, put, takeLatest, delay } from 'redux-saga/effects';

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import metadata from './block.json';
import { getBlockQueries, sanitizePostList } from './utils';

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
 * Get posts for a single block.
 *
 * @yields
 * @param {object} block - an object with a postsQuery and a clientId
 */
function* getPostsForBlock( block ) {
	const cacheKey = createCacheKey( block.postsQuery );
	const restUrl = window.newspack_blocks_data.posts_rest_url;
	let posts = POSTS_QUERIES_CACHE[ cacheKey ];
	if ( posts === undefined ) {
		const url = addQueryArgs( restUrl, {
			...block.postsQuery,
			// `context=edit` is needed, so that custom REST fields are returned.
			context: 'edit',
		} );
		posts = yield call( apiFetch, { url } );
		POSTS_QUERIES_CACHE[ cacheKey ] = posts;
	}

	const postsIds = posts.map( post => post.id );
	yield put( { type: 'UPDATE_BLOCK_POSTS', clientId: block.clientId, posts } );
	return postsIds;
}

/**
 * Whether a block uses deduplication.
 *
 * @param {string} clientId
 *
 * @returns {boolean} whether the block uses deduplication
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
	 * @yields
	 */
	function* fetchPosts() {
		// debounce by 300ms
		yield delay( 300 );

		const { getBlocks } = select( 'core/block-editor' );
		const { getCurrentPostId } = select( 'core/editor' );

		yield put( { type: 'DISABLE_UI' } );

		// Ensure innerBlocks are populated for widget area blocks.
		// See https://github.com/WordPress/gutenberg/issues/32607#issuecomment-890728216.
		const blocks = getBlocks().map( block => {
			const innerBlocks = select( 'core/block-editor' ).getBlocks( block.clientId );
			return {
				...block,
				innerBlocks,
			};
		} );

		const blockQueries = getBlockQueries( blocks, blockNames );

		// Use requested specific posts ids as the starting state of exclusion list.
		const specificPostsId = blockQueries.reduce( ( acc, { clientId, postsQuery } ) => {
			if ( shouldDeduplicate( clientId ) && postsQuery.include ) {
				acc = [ ...acc, ...postsQuery.include ];
			}
			return acc;
		}, [] );

		let exclude = sanitizePostList( [ ...specificPostsId, getCurrentPostId() ] );
		while ( blockQueries.length ) {
			const nextBlock = blockQueries.shift();
			const deduplicate = shouldDeduplicate( nextBlock.clientId );
			if ( deduplicate ) {
				nextBlock.postsQuery.exclude = exclude;
			}
			let fetchedPostIds = [];
			try {
				fetchedPostIds = yield call( getPostsForBlock, nextBlock );
			} catch ( e ) {
				yield put( { type: 'UPDATE_BLOCK_ERROR', clientId: nextBlock.clientId, error: e.message } );
			}
			if ( deduplicate ) {
				exclude = [ ...exclude, ...fetchedPostIds ];
			}
		}

		yield put( { type: 'ENABLE_UI' } );
	}

	/**
	 * Starts fetchPosts on each dispatched `REFLOW` action.
	 *
	 * fetchPosts will wait 300ms before fetching. Thanks to takeLatest,
	 * if new reflow happens during this time, the reflow from before
	 * will be cancelled.
	 *
	 * @yields
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
