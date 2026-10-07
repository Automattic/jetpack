import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import apiFetch from '@wordpress/api-fetch';
import {
	commitTailoring,
	MAX_VALIDATION_ERROR_LENGTH,
	MAX_VALIDATION_ERRORS,
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
let rejectWith: unknown = new Error( '422' );

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

/**
 * Commit a tailoring that is expected to settle with a result (no page leaving).
 *
 * @param args - commitTailoring's arguments.
 * @return The result.
 */
async function committed( ...args: Parameters< typeof commitTailoring > ) {
	const result = await commitTailoring( ...args );
	assert.ok( result, 'commitTailoring settled with nothing saved' );
	return result;
}

describe( 'commitTailoring', () => {
	beforeEach( () => {
		writes = [];
		reject = () => false;
		rejectWith = new Error( '422' );
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

	it( 'still returns a list when the write itself fails', async () => {
		reject = () => true;

		const result = await committed( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );

		assert.equal( result.source, 'fallback' );
		assert.ok( result.output.tasks.length > 0 );
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
			await commitTailoring( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( writes[ 0 ].path.includes( 'validation_errors' ), false );
		} );

		it( 'sends one reason per failed attempt with the AI write', async () => {
			await commitTailoring(
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

			await commitTailoring(
				prepared( { attempts: 2, validationErrors: [ '$: invalid JSON' ] } ),
				INPUT,
				ENGLISH_SITE_COPY
			);

			assert.match( writes[ 1 ].path, /source=fallback/ );
			assert.deepEqual( sent( writes[ 1 ].path ), [ '$: invalid JSON' ] );
		} );

		it( 'caps how many reasons are sent and how long each is', async () => {
			await commitTailoring(
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
			await commitTailoring( prepared(), INPUT, ENGLISH_SITE_COPY );

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

		it( 'records both writes when the fallback fails too, and still returns a list', async () => {
			reject = () => true;
			rejectWith = {
				code: 'rest_forbidden',
				message: SECRET,
				data: { status: 403 },
			};

			const result = await committed( prepared(), INPUT, ENGLISH_SITE_COPY );

			assert.equal( result.source, 'fallback' );
			assert.ok( result.output.tasks.length > 0 );
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

			await commitTailoring( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );

			const events = saveFailedEvents();
			assert.equal( events.length, 1 );
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

			await commitTailoring( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );

			const [ [ , props ] ] = saveFailedEvents();
			assert.match( String( props.error_code ), /^[a-z0-9_]{1,64}$/ );
			assert.equal( props.http_status, 0 );

			win.window._tkq = [];
			rejectWith = new Error( SECRET );
			await commitTailoring(
				prepared( { source: 'fallback', aiSessionId: '' } ),
				INPUT,
				ENGLISH_SITE_COPY
			);

			const [ [ , errorProps ] ] = saveFailedEvents();
			assert.equal( errorProps.error_code, 'error' );
			assert.equal( errorProps.http_status, 0 );
			assert.equal( errorProps.ai_session_id, 'none' );

			// What apiFetch rejects with when the nonce refresh it attempts after
			// `rest_cookie_invalid_nonce` throws instead of answering.
			win.window._tkq = [];
			rejectWith = new TypeError( SECRET );
			await commitTailoring( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );
			assert.equal( saveFailedEvents()[ 0 ][ 1 ].error_code, 'typeerror' );

			win.window._tkq = [];
			rejectWith = SECRET;
			await commitTailoring( prepared( { source: 'fallback' } ), INPUT, ENGLISH_SITE_COPY );
			assert.equal( saveFailedEvents()[ 0 ][ 1 ].error_code, 'unknown' );
			assert.equal( JSON.stringify( win.window._tkq ).includes( 'Jane' ), false );
		} );
	} );
} );
