import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import apiFetch from '@wordpress/api-fetch';
import { SAVE_RETRY_DELAYS_MS } from './commit-tailoring.ts';
import { ENGLISH_SITE_COPY } from './site-copy.fixture.mts';
import { LEAVING_GRACE_MS } from './tailoring-watch.ts';
import type { TrackEventProps, WizardInput } from './types.ts';

// tailor.ts reaches jwt.ts, which imports @automattic/jetpack-script-data; that package's source
// imports a type as a value, which Node's type stripping rejects. Swap in the one function jwt.ts
// uses, before tailor.ts is loaded (hence the dynamic import below).
registerHooks( {
	resolve( specifier, context, nextResolve ) {
		if ( '@automattic/jetpack-script-data' === specifier ) {
			return {
				url: 'data:text/javascript,export const isSimpleSite = () => true;',
				shortCircuit: true,
			};
		}
		return nextResolve( specifier, context );
	},
} );
const { tailor } = await import( './tailor.ts' );

// The page: an EventTarget for the lifecycle events, carrying what the code reads off `window`.
// A fresh one per test, so a run a test abandons can't hear the next test's events.
let reloads = 0;
const newPage = () =>
	Object.assign( new EventTarget(), {
		_tkq: [] as unknown[],
		wpcomAiLaunchpadTracks: { props: { channel: 'web', source: 'none' }, identity: null },
		location: { reload: () => reloads++ },
	} );
let page = newPage();

// requestJwt() returns a cached token that has not expired, so it never asks for one.
Object.defineProperty( globalThis, 'localStorage', {
	configurable: true,
	value: {
		getItem: () => JSON.stringify( { token: 't', blogId: '1', expire: Date.now() + 3_600_000 } ),
		setItem: () => {},
	},
} );

interface Put {
	path: string;
	data: { tasks: unknown[] };
}
let puts: Put[] = [];
// How the next PUT /tailored answers; resolves by default.
let putAnswer: () => Promise< unknown > = () => Promise.resolve( {} );

apiFetch.use( options => {
	if ( 'PUT' === options.method ) {
		puts.push( options as unknown as Put );
		return putAnswer();
	}
	// The available-tasks lookup: an empty menu leaves the prompt on the full one.
	return Promise.resolve( { available_task_ids: [], renderable_task_ids: [] } );
} );

const VALID_OUTPUT = {
	tasks: [
		{ id: 'first_post_published', subtitle: 'Write your first post.' },
		{ id: 'site_theme_selected', subtitle: 'Pick a theme.' },
		{ id: 'add_about_page', subtitle: 'Tell visitors who you are.' },
		{ id: 'complete_profile', subtitle: 'Complete your profile.' },
		{ id: 'drive_traffic', subtitle: 'Help people find you.' },
		{ id: 'site_launched', subtitle: 'Launch your site.' },
	],
	inferred: { goal: 'write' },
	first_post_draft: { title: 'Hello', paragraphs: [ 'One.', 'Two.' ] },
	about_page_draft: { title: 'About', paragraphs: [ 'One.', 'Two.' ] },
};

/**
 * A 200 reply from jetpack-ai-query carrying the given content.
 *
 * @param content - The reply content.
 * @return The response.
 */
const reply = ( content: unknown ) =>
	new Response(
		JSON.stringify( { choices: [ { message: { content: JSON.stringify( content ) } } ] } )
	);

/**
 * A request the browser cancelled, as fetch reports it.
 *
 * @return The rejection.
 */
const cancelled = () => Promise.reject( new TypeError( 'Failed to fetch' ) );

/** How each jetpack-ai-query call answers, in order. */
let aiCalls: Array< ( init: RequestInit ) => Promise< Response > > = [];
let aiCallCount = 0;
globalThis.fetch = ( _url, init ) => {
	aiCallCount++;
	const answer = aiCalls.shift();
	assert.ok( answer, 'more jetpack-ai-query calls than answers' );
	return answer( init ?? {} );
};

/**
 * A promise with its settlers exposed, to control when a request answers.
 *
 * @return The promise and its settlers.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

/** Let every pending promise callback run. */
const flush = async () => {
	for ( let i = 0; i < 20; i++ ) {
		await new Promise( resolve => setImmediate( resolve ) );
	}
};

const INPUT: WizardInput = {
	goal: 'write',
	site_name: 'Test Site',
	description: 'A test description.',
	locale: 'en',
	ui_locale: 'en',
};

/**
 * Start a tailoring run, tracking whether it has settled.
 *
 * @return The run and a reader for its state.
 */
function start() {
	const state = { settled: false };
	const run = tailor( INPUT, ENGLISH_SITE_COPY );
	run.then(
		() => ( state.settled = true ),
		() => ( state.settled = true )
	);
	return { run, state };
}

const abandonedEvents = () =>
	( page._tkq as Array< [ string, string, TrackEventProps ] > )
		.filter( ( [ , name ] ) => 'jetpack_ai_launchpad_tailoring_abandoned' === name )
		.map( ( [ , , props ] ) => props );

describe( 'tailor', () => {
	beforeEach( () => {
		mock.timers.enable( { apis: [ 'setTimeout' ] } );
		puts = [];
		putAnswer = () => Promise.resolve( {} );
		aiCalls = [];
		aiCallCount = 0;
		reloads = 0;
		page = newPage();
		Object.assign( globalThis, { window: page } );
	} );

	afterEach( () => {
		mock.timers.reset();
	} );

	it( 'saves nothing when the page leaving cancels the AI call', async () => {
		const call = deferred< Response >();
		aiCalls = [ () => call.promise ];
		const { state } = start();
		await flush();

		// What a reload does: beforeunload, then the request is cancelled, then pagehide.
		page.dispatchEvent( new Event( 'beforeunload' ) );
		call.reject( new TypeError( 'Failed to fetch' ) );
		await flush();
		page.dispatchEvent( new Event( 'pagehide' ) );
		await flush();

		assert.equal( aiCallCount, 1, 'no retry' );
		assert.deepEqual( puts, [], 'no fallback, no PUT: the next visit shows the wizard' );
		assert.equal( state.settled, false );
		const events = abandonedEvents();
		assert.equal( events.length, 1 );
		assert.equal( events[ 0 ].stage, 'ai' );
	} );

	it( 'reloads to the wizard when a page whose run was abandoned comes back from the cache', async () => {
		const call = deferred< Response >();
		aiCalls = [ () => call.promise ];
		start();
		await flush();
		// pagehide before the cancelled request reports back: the other order browsers use.
		page.dispatchEvent( new Event( 'beforeunload' ) );
		page.dispatchEvent( new Event( 'pagehide' ) );
		call.reject( new TypeError( 'Failed to fetch' ) );
		await flush();
		assert.equal( abandonedEvents()[ 0 ].stage, 'ai' );

		page.dispatchEvent( Object.assign( new Event( 'pageshow' ), { persisted: true } ) );

		assert.equal( reloads, 1 );
		assert.deepEqual( puts, [] );
	} );

	it( 'carries on as normal after a beforeunload that led nowhere', async () => {
		const call = deferred< Response >();
		aiCalls = [ () => call.promise, async () => reply( VALID_OUTPUT ) ];
		const { run } = start();
		await flush();

		// e.g. a download link: beforeunload fires, the page stays, and the request fails anyway.
		page.dispatchEvent( new Event( 'beforeunload' ) );
		call.reject( new TypeError( 'Failed to fetch' ) );
		await flush();
		assert.equal( aiCallCount, 1, 'held until the page shows it is staying' );

		mock.timers.tick( LEAVING_GRACE_MS );
		const result = await run;

		assert.equal( aiCallCount, 2 );
		assert.equal( result.source, 'ai' );
		assert.equal( puts.length, 1 );
		assert.match( puts[ 0 ].path, /source=ai/ );
		assert.deepEqual( abandonedEvents(), [] );
	} );

	it( 'retries a network failure once when the page is not leaving', async () => {
		aiCalls = [ cancelled, async () => reply( VALID_OUTPUT ) ];

		const result = await tailor( INPUT, ENGLISH_SITE_COPY );

		assert.equal( aiCallCount, 2 );
		assert.equal( result.source, 'ai' );
		assert.match( puts[ 0 ].path, /attempts=2/ );
		assert.match( decodeURIComponent( puts[ 0 ].path ), /validation_errors\[0\]=request: failed/ );
	} );

	it( 'still falls back when both attempts really fail', async () => {
		aiCalls = [
			async () => new Response( '', { status: 503 } ),
			async () => new Response( '', { status: 503 } ),
		];

		const result = await tailor( INPUT, ENGLISH_SITE_COPY );

		assert.equal( aiCallCount, 2 );
		assert.equal( result.source, 'fallback' );
		assert.equal( puts.length, 1 );
		assert.match( puts[ 0 ].path, /source=fallback/ );
	} );

	it( 'does not retry our own timeout', async () => {
		aiCalls = [
			init =>
				new Promise( ( _resolve, reject ) =>
					init.signal?.addEventListener( 'abort', () => reject( new DOMException( 'aborted' ) ) )
				),
		];
		const { run } = start();
		await flush();

		mock.timers.tick( 40_000 );
		const result = await run;

		assert.equal( aiCallCount, 1 );
		assert.equal( result.source, 'fallback' );
		assert.match( decodeURIComponent( puts[ 0 ].path ), /request: timed out/ );
	} );

	it( 'saves nothing in place of an AI list whose write the page leaving cancelled', async () => {
		aiCalls = [ async () => reply( VALID_OUTPUT ) ];
		const put = deferred< unknown >();
		putAnswer = () => put.promise;
		const { state } = start();
		await flush();
		assert.equal( puts.length, 1 );
		assert.match( puts[ 0 ].path, /source=ai/ );

		page.dispatchEvent( new Event( 'beforeunload' ) );
		page.dispatchEvent( new Event( 'pagehide' ) );
		put.reject( { code: 'fetch_error', message: 'You are probably offline.' } );
		await flush();

		assert.equal( puts.length, 1, 'no fallback write' );
		assert.equal( state.settled, false );
		assert.equal( abandonedEvents()[ 0 ].stage, 'saving' );
	} );

	it( 'sends the list write with keepalive, so it can finish after the page is gone', async () => {
		aiCalls = [ async () => reply( VALID_OUTPUT ) ];

		await tailor( INPUT, ENGLISH_SITE_COPY );

		assert.equal( ( puts[ 0 ] as unknown as RequestInit ).keepalive, true );
	} );

	describe( 'when the list write keeps failing in transit', () => {
		const offline = () => Promise.reject( { code: 'fetch_error', message: 'Offline.' } );

		/** Let the automatic retries run through their waits. */
		const runRetries = async () => {
			for ( const delay of SAVE_RETRY_DELAYS_MS ) {
				await flush();
				mock.timers.tick( delay );
			}
			await flush();
		};

		it( 'shows the save error, and "Try again" saves the same list without a new AI call', async () => {
			aiCalls = [ async () => reply( VALID_OUTPUT ) ];
			putAnswer = offline;
			const { run } = start();
			await runRetries();

			const result = await run;
			assert.equal( result.source, 'ai' );
			assert.ok( result.saveError );
			assert.equal( puts.length, 1 + SAVE_RETRY_DELAYS_MS.length );
			assert.ok(
				puts.every( put => /source=ai/.test( put.path ) ),
				'no fallback write'
			);

			putAnswer = () => Promise.resolve( {} );
			assert.equal( await result.saveError.retry(), true );
			assert.equal( aiCallCount, 1, 'no new AI call' );
			assert.equal( puts.at( -1 )?.data, puts[ 0 ].data );
		} );

		it( 'sends nothing more, and shows no error, once the page is leaving', async () => {
			aiCalls = [ async () => reply( VALID_OUTPUT ) ];
			putAnswer = offline;
			const { state } = start();
			await flush();
			assert.equal( puts.length, 1 );

			// The user leaves during the wait before the first retry.
			page.dispatchEvent( new Event( 'beforeunload' ) );
			page.dispatchEvent( new Event( 'pagehide' ) );
			await runRetries();

			assert.equal( puts.length, 1 );
			assert.equal( state.settled, false, 'no result for the host to render an error from' );
			assert.equal( abandonedEvents()[ 0 ].stage, 'saving' );
		} );
	} );
} );
