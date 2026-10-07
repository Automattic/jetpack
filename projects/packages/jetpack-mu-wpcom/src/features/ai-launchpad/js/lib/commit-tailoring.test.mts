import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import apiFetch from '@wordpress/api-fetch';
import {
	commitTailoring,
	MAX_VALIDATION_ERROR_LENGTH,
	MAX_VALIDATION_ERRORS,
	SAVE_RETRY_DELAYS_MS,
	type PreparedTailoring,
} from './commit-tailoring.ts';
import { ENGLISH_SITE_COPY } from './site-copy.fixture.mts';
import { resetTracksContext } from './tracks.ts';
import type { TailoredOutput, TrackEventProps, WizardInput } from './types.ts';

interface Write {
	path: string;
	data: TailoredOutput;
}

let writes: Write[] = [];
let reject: ( path: string ) => boolean = () => false;
// What a rejected write rejects with: apiFetch rejects with the WP error body, or with
// `{ code: 'fetch_error', message }` when there was no response at all.
const REJECTED = {
	code: 'ai_launchpad_invalid_payload',
	message: 'Rejected.',
	data: { status: 422 },
};
const OFFLINE = { code: 'fetch_error', message: 'You are probably offline.' };
let rejectWith: unknown = REJECTED;

// A middleware that returns without calling next() short-circuits the request, so
// nothing reaches the network and every PUT is recorded instead.
apiFetch.use( options => {
	const write = options as unknown as Write;
	writes.push( write );
	return reject( write.path ) ? Promise.reject( rejectWith ) : Promise.resolve( {} );
} );

// tracks.ts touches window only inside record(), so a bare object is enough.
const win = globalThis as unknown as {
	window: { _tkq?: unknown[]; wpcomAiLaunchpadTracks?: unknown };
};
win.window = {};

/**
 * The props of every event with this name recorded so far.
 *
 * @param suffix - The event name, without the `jetpack_ai_launchpad_tailoring_` prefix.
 * @return The props, in order.
 */
const eventsNamed = ( suffix: string ) =>
	( ( win.window._tkq ?? [] ) as Array< [ string, string, TrackEventProps ] > )
		.filter(
			( [ kind, name ] ) =>
				'recordEvent' === kind && `jetpack_ai_launchpad_tailoring_${ suffix }` === name
		)
		.map( ( [ , , props ] ) => props );

/**
 * The save-failed events recorded so far, as [ name, props ] pairs.
 *
 * @return The events.
 */
const saveFailedEvents = () =>
	( ( win.window._tkq ?? [] ) as Array< [ string, string, TrackEventProps ] > )
		.filter( ( [ kind, name ] ) => 'recordEvent' === kind && name.endsWith( '_save_failed' ) )
		.map( ( [ , name, props ] ) => [ name, props ] as const );

const INPUT: WizardInput = {
	goal: 'write',
	site_name: 'Test Site',
	description: 'A test description.',
	locale: 'en',
	ui_locale: 'en',
};

const AI_OUTPUT = {
	tasks: [ { id: 'site_launched', subtitle: 'Go live.' } ],
	inferred: { goal: 'write', brand_name: 'Test Site' },
	first_post_draft: { title: 'Hello', subtitle: 'Hi', paragraphs: [ 'One.' ] },
} as TailoredOutput;

/**
 * Build a prepared tailoring with fixed telemetry.
 *
 * @param overrides - The fields under test.
 * @return The prepared tailoring.
 */
function prepared( overrides: Partial< PreparedTailoring > = {} ): PreparedTailoring {
	return {
		source: 'ai',
		output: AI_OUTPUT,
		durationMs: 1234,
		attempts: 1,
		aiSessionId: 'session-id',
		validationErrors: [],
		...overrides,
	};
}

// The waits between automatic retries, recorded instead of waited.
let slept: number[] = [];

/**
 * Commit a tailoring without waiting between retries.
 *
 * @param tailoring - The tailoring to write.
 * @param input     - The wizard input.
 * @param copy      - The site copy.
 * @param options   - commitTailoring's options; `sleep` is replaced.
 * @return What commitTailoring returns.
 */
function commit(
	tailoring: PreparedTailoring,
	input: WizardInput,
	copy: Parameters< typeof commitTailoring >[ 2 ],
	options: Parameters< typeof commitTailoring >[ 3 ] = {}
) {
	return commitTailoring( tailoring, input, copy, {
		...options,
		sleep: async ms => {
			slept.push( ms );
		},
	} );
}

/**
 * Commit a tailoring that is expected to settle with a result (no page leaving).
 *
 * @param args - commit's arguments.
 * @return The result.
 */
async function committed( ...args: Parameters< typeof commitTailoring > ) {
	const result = await commit( ...args );
	assert.ok( result, 'commitTailoring settled with nothing saved' );
	return result;
}

describe( 'commitTailoring', () => {
	beforeEach( () => {
		writes = [];
		reject = () => false;
		rejectWith = REJECTED;
		slept = [];
		resetTracksContext();
		win.window = {
			_tkq: [],
			wpcomAiLaunchpadTracks: {
				props: {
					channel: 'web',
					agent_name: 'ai_launchpad',
					source: 'none',
					ai_session_id: 'none',
				},
				identity: null,
			},
		};
	} );

	it( 'persists an AI tailoring once, with the telemetry measured when it was prepared', async () => {
		const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

		assert.equal( result.source, 'ai' );
		assert.equal( result.output, AI_OUTPUT );
		assert.equal( writes.length, 1 );
		assert.equal( writes[ 0 ].data, AI_OUTPUT );
		assert.match( writes[ 0 ].path, /source=ai/ );
		assert.match( writes[ 0 ].path, /duration_ms=1234/ );
		assert.match( writes[ 0 ].path, /attempts=1/ );
		assert.match( writes[ 0 ].path, /ai_session_id=session-id/ );
	} );

	it( 'persists a prepared fallback as it stands, tagged as the fallback', async () => {
		const fallback = { ...AI_OUTPUT };
		const result = await committed(
			prepared( { source: 'fallback', output: fallback, attempts: 2 } ),
			INPUT,
			ENGLISH_SITE_COPY
		);

		assert.equal( result.source, 'fallback' );
		assert.equal( result.output, fallback );
		assert.equal( writes.length, 1 );
		assert.match( writes[ 0 ].path, /source=fallback/ );
		assert.match( writes[ 0 ].path, /attempts=2/ );
	} );

	it( 'falls back to the deterministic picker when the server rejects the AI output', async () => {
		reject = path => path.includes( 'source=ai' );

		const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

		assert.equal( result.source, 'fallback' );
		assert.notEqual( result.output, AI_OUTPUT );
		assert.equal( writes.length, 2 );
		assert.match( writes[ 1 ].path, /source=fallback/ );
		assert.equal( writes[ 1 ].data, result.output );
	} );

	describe( 'saving', () => {
		it( 'retries a write that failed in transit, and saves the AI list without a fallback', async () => {
			let failures = 1;
			reject = () => failures-- > 0;
			rejectWith = OFFLINE;

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'ai' );
			assert.equal( result.saveError, undefined );
			assert.deepEqual(
				writes.map( write => write.data ),
				[ AI_OUTPUT, AI_OUTPUT ]
			);
			assert.deepEqual( slept, [ SAVE_RETRY_DELAYS_MS[ 0 ] ] );
			assert.deepEqual(
				saveFailedEvents().map( ( [ , props ] ) => [ props.failed_write, props.retry ] ),
				[ [ 'ai', 0 ] ]
			);
			assert.deepEqual(
				eventsNamed( 'save_outcome' ).map( props => props.save_outcome ),
				[ 'saved' ]
			);
		} );

		it( 'treats a 5xx as a transport failure', async () => {
			let failures = 1;
			reject = () => failures-- > 0;
			rejectWith = { code: 'internal_server_error', message: 'Oops.', data: { status: 503 } };

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'ai' );
			assert.equal( writes.length, 2 );
		} );

		it( 'shows the save error instead of a fallback when the AI list never saves', async () => {
			reject = () => true;
			rejectWith = OFFLINE;

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'ai' );
			assert.equal( result.output, AI_OUTPUT );
			assert.ok( result.saveError );
			assert.equal( writes.length, 1 + SAVE_RETRY_DELAYS_MS.length );
			assert.ok(
				writes.every( write => /source=ai/.test( write.path ) ),
				'no fallback write'
			);
			assert.deepEqual( slept, [ ...SAVE_RETRY_DELAYS_MS ] );
			assert.deepEqual(
				saveFailedEvents().map( ( [ , props ] ) => props.retry ),
				[ 0, 1, 2 ]
			);
			assert.deepEqual(
				eventsNamed( 'save_outcome' ).map( props => props.save_outcome ),
				[ 'error_shown' ]
			);
		} );

		it( 'lets "Try again" re-send the same list once per click', async () => {
			reject = () => true;
			rejectWith = OFFLINE;
			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );
			assert.ok( result.saveError );
			writes = [];

			// Still offline: one write, reported as the next attempt.
			assert.equal( await result.saveError.retry(), false );
			assert.equal( writes.length, 1 );
			assert.equal( saveFailedEvents().at( -1 )?.[ 1 ].retry, 3 );

			reject = () => false;
			assert.equal( await result.saveError.retry(), true );
			assert.equal( writes.length, 2 );
			assert.equal( writes[ 1 ].data, AI_OUTPUT, 'the same output, not a new one' );
			assert.match( writes[ 1 ].path, /source=ai/ );
			assert.deepEqual(
				eventsNamed( 'save_retry_clicked' ).map( props => [ props.failed_write, props.result ] ),
				[
					[ 'ai', 'failed' ],
					[ 'ai', 'saved' ],
				]
			);
			// The automatic phase's outcome stands; the clicks have their own event.
			assert.equal( eventsNamed( 'save_outcome' ).length, 1 );
		} );

		it( 'saves the fallback when the server rejects the AI list', async () => {
			reject = path => path.includes( 'source=ai' );

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'fallback' );
			assert.equal( result.saveError, undefined );
			assert.equal( writes.length, 2, 'a rejection is not retried' );
			assert.deepEqual( slept, [] );
			assert.deepEqual(
				eventsNamed( 'save_outcome' ).map( props => props.save_outcome ),
				[ 'fallback_saved' ]
			);
		} );

		it( 'retries a fallback write that fails in transit, then shows the save error', async () => {
			rejectWith = REJECTED;
			reject = path => {
				if ( path.includes( 'source=ai' ) ) {
					return true;
				}
				rejectWith = OFFLINE;
				return true;
			};

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'fallback' );
			assert.ok( result.saveError );
			assert.deepEqual(
				writes.map( write => /source=(\w+)/.exec( write.path )?.[ 1 ] ),
				[ 'ai', 'fallback', 'fallback', 'fallback' ]
			);
			assert.deepEqual(
				saveFailedEvents().map( ( [ , props ] ) => [ props.failed_write, props.retry ] ),
				[
					[ 'ai', 0 ],
					[ 'fallback', 0 ],
					[ 'fallback', 1 ],
					[ 'fallback', 2 ],
				]
			);
			assert.deepEqual(
				eventsNamed( 'save_outcome' ).map( props => props.save_outcome ),
				[ 'error_shown' ]
			);
		} );

		it( 'stops retrying, and reports nothing more, once the page is leaving', async () => {
			reject = () => true;
			rejectWith = OFFLINE;
			// Not leaving when the first write fails; leaving by the time the retry is due.
			let checks = 0;
			const pageIsLeaving = async () => checks++ > 0;

			const result = await commit( prepared(), INPUT, ENGLISH_SITE_COPY, { pageIsLeaving } );

			assert.equal( result, null );
			assert.equal( writes.length, 1 );
			assert.equal( saveFailedEvents().length, 1 );
			assert.deepEqual( eventsNamed( 'save_outcome' ), [] );
		} );
	} );

	describe( 'validation_errors', () => {
		/**
		 * The validation_errors values a write carried, in order.
		 *
		 * @param path - The PUT path, query string included.
		 * @return The decoded values.
		 */
		const sent = ( path: string ) =>
			[ ...new URLSearchParams( path.split( '?' )[ 1 ] ).entries() ]
				.filter( ( [ key ] ) => key.startsWith( 'validation_errors[' ) )
				.map( ( [ , value ] ) => value );

		it( 'leaves the param off when every attempt succeeded', async () => {
			await commit( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( writes[ 0 ].path.includes( 'validation_errors' ), false );
		} );

		it( 'sends one reason per failed attempt with the AI write', async () => {
			await commit(
				prepared( {
					attempts: 2,
					validationErrors: [ 'first_post_draft.subtitle: expected string' ],
				} ),
				INPUT,
				ENGLISH_SITE_COPY
			);

			assert.deepEqual( sent( writes[ 0 ].path ), [
				'first_post_draft.subtitle: expected string',
			] );
		} );

		it( 'carries the reasons onto the fallback write when the server rejects the AI output', async () => {
			reject = path => path.includes( 'source=ai' );

			await commit(
				prepared( { attempts: 2, validationErrors: [ '$: invalid JSON' ] } ),
				INPUT,
				ENGLISH_SITE_COPY
			);

			assert.match( writes[ 1 ].path, /source=fallback/ );
			assert.deepEqual( sent( writes[ 1 ].path ), [ '$: invalid JSON' ] );
		} );

		it( 'caps how many reasons are sent and how long each is', async () => {
			await commit(
				prepared( {
					source: 'fallback',
					validationErrors: Array.from( { length: MAX_VALIDATION_ERRORS + 2 }, () =>
						'x'.repeat( MAX_VALIDATION_ERROR_LENGTH + 50 )
					),
				} ),
				INPUT,
				ENGLISH_SITE_COPY
			);

			const reasons = sent( writes[ 0 ].path );
			assert.equal( reasons.length, MAX_VALIDATION_ERRORS );
			for ( const reason of reasons ) {
				assert.equal( reason.length, MAX_VALIDATION_ERROR_LENGTH );
			}
		} );
	} );

	describe( 'failed writes', () => {
		// The message can quote the payload, so it must never reach an event.
		const SECRET = 'payload.inferred.niche Café of Jane Doe';

		it( 'records nothing when the write succeeds', async () => {
			await commit( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.deepEqual( saveFailedEvents(), [] );
		} );

		it( 'records the failed AI write, then renders the fallback it saved', async () => {
			reject = path => path.includes( 'source=ai' );
			rejectWith = {
				code: 'ai_launchpad_invalid_payload',
				message: SECRET,
				data: { status: 422 },
			};

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'fallback' );
			assert.equal( writes.length, 2 );
			const events = saveFailedEvents();
			assert.equal( events.length, 1 );
			const [ name, props ] = events[ 0 ];
			assert.equal( name, 'jetpack_ai_launchpad_tailoring_save_failed' );
			assert.equal( props.failed_write, 'ai' );
			// The standard `source` prop is left to the bootstrap, not overridden by this event.
			assert.equal( props.source, 'none' );
			assert.equal( props.http_status, 422 );
			assert.equal( props.error_code, 'ai_launchpad_invalid_payload' );
			assert.equal( props.ai_session_id, 'session-id' );
			// The standard props ride along like on every other event.
			assert.equal( props.channel, 'web' );
			assert.equal( props.agent_name, 'ai_launchpad' );
			assert.equal( JSON.stringify( win.window._tkq ).includes( 'Jane' ), false );
		} );

		it( 'records both writes when the fallback is rejected too, and shows the save error', async () => {
			reject = () => true;
			rejectWith = {
				code: 'rest_forbidden',
				message: SECRET,
				data: { status: 403 },
			};

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'fallback' );
			assert.ok( result.saveError, 'a list nobody saved is not shown' );
			assert.deepEqual(
				saveFailedEvents().map( ( [ , props ] ) => [
					props.failed_write,
					props.http_status,
					props.error_code,
				] ),
				[
					[ 'ai', 403, 'rest_forbidden' ],
					[ 'fallback', 403, 'rest_forbidden' ],
				]
			);
			assert.equal( JSON.stringify( win.window._tkq ).includes( 'Jane' ), false );
		} );

		it( 'records a network error with no status as status 0', async () => {
			reject = () => true;
			rejectWith = { code: 'fetch_error', message: 'You are probably offline.' };

			await commit( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );

			const events = saveFailedEvents();
			assert.equal( events.length, 1 + SAVE_RETRY_DELAYS_MS.length );
			assert.equal( events[ 0 ][ 1 ].failed_write, 'fallback' );
			assert.equal( events[ 0 ][ 1 ].http_status, 0 );
			assert.equal( events[ 0 ][ 1 ].error_code, 'fetch_error' );
			assert.equal( JSON.stringify( win.window._tkq ).includes( 'offline' ), false );
		} );

		it( 'reduces an odd code to a safe one, an Error to its name, and anything else to "unknown"', async () => {
			reject = () => true;
			rejectWith = {
				code: `Bad-Code "${ SECRET }" ${ 'x'.repeat( 100 ) }`,
				data: { status: '500' },
			};

			await commit( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );

			const [ [ , props ] ] = saveFailedEvents();
			assert.match( String( props.error_code ), /^[a-z0-9_]{1,64}$/ );
			assert.equal( props.http_status, 0 );

			win.window._tkq = [];
			rejectWith = new Error( SECRET );
			await commit( prepared( { source: 'fallback', aiSessionId: '' } ), INPUT, ENGLISH_SITE_COPY );

			const [ [ , errorProps ] ] = saveFailedEvents();
			assert.equal( errorProps.error_code, 'error' );
			assert.equal( errorProps.http_status, 0 );
			assert.equal( errorProps.ai_session_id, 'none' );

			// What apiFetch rejects with when the nonce refresh it attempts after
			// `rest_cookie_invalid_nonce` throws instead of answering.
			win.window._tkq = [];
			rejectWith = new TypeError( SECRET );
			await commit( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );
			assert.equal( saveFailedEvents()[ 0 ][ 1 ].error_code, 'typeerror' );

			win.window._tkq = [];
			rejectWith = SECRET;
			await commit( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );
			assert.equal( saveFailedEvents()[ 0 ][ 1 ].error_code, 'unknown' );
			assert.equal( JSON.stringify( win.window._tkq ).includes( 'Jane' ), false );
		} );
	} );
} );
