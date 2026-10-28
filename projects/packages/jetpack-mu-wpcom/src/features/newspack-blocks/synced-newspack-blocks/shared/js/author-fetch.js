/**
 * Shared author lookups for the editor.
 *
 * Every Author Profile block used to fetch its author with its own request, so a staff page
 * with thirty blocks fired thirty requests at once and, on a site near its PHP worker limit,
 * some were dropped. Lookups made within one short window are combined into a single call to
 * the authors endpoint, results are shared between blocks and kept briefly, and identical
 * suggestion-list requests are de-duplicated the same way.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const ENDPOINT = '/newspack-blocks/v1/authors';

// Blocks mount in bursts as the editor renders. This is long enough to catch a burst and
// short enough to be invisible next to the request itself.
const BATCH_WINDOW_MS = 50;

// Most ids the endpoint resolves in one request. Larger batches are split to match, so a block
// past the limit is not told its author does not exist.
const MAX_BATCH_IDS = 100;

// Long enough to cover a page load and block re-mounts, short enough that a profile edited in
// another tab shows up on the next reload.
const CACHE_TTL_MS = 60 * 1000;

const cache = new Map();
const pendingBatches = new Map();
const inFlightLists = new Map();

const authorKey = ( authorId, isGuestAuthor ) => `${ isGuestAuthor ? 'g' : 'u' }:${ authorId }`;

const readCache = key => {
	const hit = cache.get( key );
	if ( ! hit ) {
		return null;
	}
	if ( hit.expires < Date.now() ) {
		cache.delete( key );
		return null;
	}
	return hit;
};

const writeCache = ( key, value ) => cache.set( key, { expires: Date.now() + CACHE_TTL_MS, value } );

/**
 * Request a set of authors, giving a failed request one more try.
 *
 * A request dropped by a busy server is the failure this fetcher exists to soften, and a whole
 * page of blocks now rides on each one, so a single failure should not blank every block.
 *
 * @param {Object} params Query params.
 * @return {Promise<Array>} The author records.
 */
const requestAuthors = async params => {
	const path = addQueryArgs( ENDPOINT, params );
	try {
		return await apiFetch( { path } );
	} catch {
		return apiFetch( { path } );
	}
};

/**
 * Resolve every caller covered by one request from its response.
 *
 * @param {string}  batchKey Key grouping lookups that share fields and avatar options.
 * @param {Array}   entries  Queued lookups the request carries.
 * @param {Promise} request  The request.
 */
const settleEntries = async ( batchKey, entries, request ) => {
	try {
		const authors = await request;
		const byKey = new Map( ( authors || [] ).map( author => [ authorKey( author.id, author.is_guest ), author ] ) );
		entries.forEach( entry => {
			const key = authorKey( entry.authorId, entry.isGuestAuthor );
			// A guest id that matched no guest author comes back as the WP user with that id.
			const author = byKey.get( key ) || ( entry.isGuestAuthor ? byKey.get( authorKey( entry.authorId, false ) ) : undefined );
			writeCache( `${ batchKey }|${ key }`, author );
			entry.settlers.forEach( ( { resolve } ) => resolve( author ) );
		} );
	} catch ( error ) {
		entries.forEach( entry => entry.settlers.forEach( ( { reject } ) => reject( error ) ) );
	}
};

/**
 * Send the lookups queued under a batch key, in as many requests as the endpoint's limit needs.
 *
 * @param {string} batchKey Key grouping lookups that share fields and avatar options.
 */
const flushBatch = batchKey => {
	const batch = pendingBatches.get( batchKey );
	pendingBatches.delete( batchKey );
	if ( ! batch ) {
		return;
	}

	const entries = Array.from( batch.entries.values() );
	const userEntries = entries.filter( entry => ! entry.isGuestAuthor );
	const guestEntries = entries.filter( entry => entry.isGuestAuthor );
	const requests = Math.max( Math.ceil( userEntries.length / MAX_BATCH_IDS ), Math.ceil( guestEntries.length / MAX_BATCH_IDS ) );

	for ( let i = 0; i < requests; i++ ) {
		const users = userEntries.slice( i * MAX_BATCH_IDS, ( i + 1 ) * MAX_BATCH_IDS );
		const guests = guestEntries.slice( i * MAX_BATCH_IDS, ( i + 1 ) * MAX_BATCH_IDS );
		const params = { fields: batch.fields };
		if ( batch.avatarHideDefault ) {
			params.avatar_hide_default = 1;
		}
		if ( users.length ) {
			params.author_ids = users.map( entry => entry.authorId ).join( ',' );
		}
		if ( guests.length ) {
			params.guest_author_ids = guests.map( entry => entry.authorId ).join( ',' );
		}
		settleEntries( batchKey, [ ...users, ...guests ], requestAuthors( params ) );
	}
};

/**
 * Look up one author, sharing the request with every other lookup made in the same window.
 *
 * @param {Object}  options
 * @param {number}  options.authorId          WP user ID, or guest author post ID.
 * @param {boolean} options.isGuestAuthor     Whether the ID is a guest author.
 * @param {string}  options.fields            Comma-separated fields to request.
 * @param {boolean} options.avatarHideDefault Whether to hide the default avatar.
 * @return {Promise<Object|undefined>} The author record, or undefined when none matched.
 */
export function fetchAuthorById( { authorId, isGuestAuthor = false, fields, avatarHideDefault = false } ) {
	const id = parseInt( authorId, 10 );
	const batchKey = `${ fields }|${ avatarHideDefault ? 1 : 0 }`;
	const key = authorKey( id, !! isGuestAuthor );

	const cached = readCache( `${ batchKey }|${ key }` );
	if ( cached ) {
		return Promise.resolve( cached.value );
	}

	let batch = pendingBatches.get( batchKey );
	if ( ! batch ) {
		batch = {
			fields,
			avatarHideDefault,
			entries: new Map(),
			timer: setTimeout( () => flushBatch( batchKey ), BATCH_WINDOW_MS ),
		};
		pendingBatches.set( batchKey, batch );
	}

	let entry = batch.entries.get( key );
	if ( ! entry ) {
		entry = { authorId: id, isGuestAuthor: !! isGuestAuthor, settlers: [] };
		batch.entries.set( key, entry );
	}

	return new Promise( ( resolve, reject ) => entry.settlers.push( { resolve, reject } ) );
}

/**
 * Fetch a page of author suggestions, sharing identical in-flight requests.
 *
 * @param {Object} options
 * @param {string} options.search Search string.
 * @param {number} options.offset Offset for pagination.
 * @param {string} options.fields Comma-separated fields to request.
 * @return {Promise<{authors: Array, total: number}>} Authors and the total reported by the endpoint.
 */
export function fetchAuthorList( { search, offset, fields = 'id,name' } = {} ) {
	const params = { search: search || '', offset: offset || 0, fields };
	const key = `list|${ params.search }|${ params.offset }|${ params.fields }`;
	// Only the initial list is worth keeping: every empty block asks for it at once, while a typed
	// search should see an author created or renamed a moment ago.
	const keep = ! params.search && ! params.offset;

	const cached = keep ? readCache( key ) : null;
	if ( cached ) {
		return Promise.resolve( cached.value );
	}
	if ( inFlightLists.has( key ) ) {
		return inFlightLists.get( key );
	}

	// The request starts on the next tick, once it is recorded as in flight, so one that fails
	// before it starts is still cleared instead of being handed to every later caller.
	const request = Promise.resolve()
		.then( () => apiFetch( { parse: false, path: addQueryArgs( ENDPOINT, params ) } ) )
		.then( async response => {
			const total = parseInt( response.headers.get( 'x-wp-total' ) || 0, 10 );
			const authors = await response.json();
			const result = { authors, total };
			if ( keep ) {
				writeCache( key, result );
			}
			return result;
		} )
		.finally( () => inFlightLists.delete( key ) );
	inFlightLists.set( key, request );

	return request;
}

/**
 * Forget cached results and queued lookups. Intended for tests.
 */
export function resetAuthorFetchCache() {
	cache.clear();
	pendingBatches.forEach( batch => clearTimeout( batch.timer ) );
	pendingBatches.clear();
	inFlightLists.clear();
}
