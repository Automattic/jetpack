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
import type { TailoredOutput, WizardInput } from './types.ts';

interface Write {
	path: string;
	data: TailoredOutput;
}

let writes: Write[] = [];
let reject: ( path: string ) => boolean = () => false;

// A middleware that returns without calling next() short-circuits the request, so
// nothing reaches the network and every PUT is recorded instead.
apiFetch.use( options => {
	const write = options as unknown as Write;
	writes.push( write );
	return reject( write.path ) ? Promise.reject( new Error( '422' ) ) : Promise.resolve( {} );
} );

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

describe( 'commitTailoring', () => {
	beforeEach( () => {
		writes = [];
		reject = () => false;
	} );

	it( 'persists an AI tailoring once, with the telemetry measured when it was prepared', async () => {
		const result = await commitTailoring( prepared(), INPUT, ENGLISH_SITE_COPY );

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
		const result = await commitTailoring(
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

		const result = await commitTailoring( prepared(), INPUT, ENGLISH_SITE_COPY );

		assert.equal( result.source, 'fallback' );
		assert.notEqual( result.output, AI_OUTPUT );
		assert.equal( writes.length, 2 );
		assert.match( writes[ 1 ].path, /source=fallback/ );
		assert.equal( writes[ 1 ].data, result.output );
	} );

	it( 'still returns a list when the write itself fails', async () => {
		reject = () => true;

		const result = await commitTailoring(
			prepared( { source: 'fallback' } ),
			INPUT,
			ENGLISH_SITE_COPY
		);

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
} );
