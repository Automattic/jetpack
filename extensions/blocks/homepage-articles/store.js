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
import { registerGenericStore, select } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import { getBlockQueries } from './utils';

const { name } = metadata;
export const STORE_NAMESPACE = `jetpack/${ name }`;

const initialState = {
	// Map of returned posts to block clientIds.
	postsByBlock: {},
	errorsByBlock: {},
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
 * @param {Object} block an object with a postsQuery and a clientId
 */
function* getPosts( block ) {
	const cacheKey = createCacheKey( block.postsQuery );
	let posts = POSTS_QUERIES_CACHE[ cacheKey ];
	if ( posts === undefined ) {
		const path = addQueryArgs( '/wp/v2/posts', {
			...block.postsQuery,
			// `context=edit` is needed, so that custom REST fields are returned.
			context: 'edit',
		} );
		posts = yield call( apiFetch, { path } );
		POSTS_QUERIES_CACHE[ cacheKey ] = posts;
	}

	const postsIds = posts.map( post => post.id );
	yield put( { type: 'UPDATE_BLOCK_POSTS', clientId: block.clientId, posts } );
	return postsIds;
}

const createFetchPostsSaga = blockName => {
	/**
	 * "worker" Saga: will be fired on REFLOW actions
	 */
	function* fetchPosts() {
		// debounce by 300ms
		yield delay( 300 );

		const { getBlocks } = select( 'core/block-editor' );
		const { getCurrentPostId } = select( 'core/editor' );

		yield put( { type: 'DISABLE_UI' } );

		const blockQueries = getBlockQueries( getBlocks(), blockName );

		// Use requested specific posts ids as the starting state of exclusion list.
		const specificPostsId = blockQueries.reduce( ( acc, { postsQuery } ) => {
			if ( postsQuery.include ) {
				acc = [ ...acc, ...postsQuery.include ];
			}
			return acc;
		}, [] );

		let exclude = [ ...specificPostsId, getCurrentPostId() ];
		while ( blockQueries.length ) {
			const nextBlock = blockQueries.shift();
			nextBlock.postsQuery.exclude = exclude;
			let fetchedPostIds = [];
			try {
				fetchedPostIds = yield call( getPosts, nextBlock );
			} catch ( e ) {
				yield put( { type: 'UPDATE_BLOCK_ERROR', clientId: nextBlock.clientId, error: e.message } );
			}
			exclude = [ ...exclude, ...fetchedPostIds ];
		}

		yield put( { type: 'ENABLE_UI' } );
	}

	/**
	 * Starts fetchPosts on each dispatched `REFLOW` action.
	 *
	 * fetchPosts will wait 300ms before fetching. Thanks to takeLatest,
	 * if new reflow happens during this time, the reflow from before
	 * will be cancelled.
	 */
	return function* fetchPostsSaga() {
		yield takeLatest( 'REFLOW', fetchPosts );
	};
};

export const registerQueryStore = blockName => {
	registerGenericStore( STORE_NAMESPACE, genericStore );

	// Run the saga ✨
	sagaMiddleware.run( createFetchPostsSaga( blockName ) );
};
