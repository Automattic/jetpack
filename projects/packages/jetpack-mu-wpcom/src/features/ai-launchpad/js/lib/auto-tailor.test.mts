import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import type { SiteCopy, TailoredOutput, TailorResult } from './types.ts';
import type { LaunchpadData } from '../tailored-list/model.ts';

// auto-tailor.ts reaches jwt.ts, whose script-data import Node cannot load; see tailor.test.mts.
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
const { buildAutoInput, waitForTailoring } = await import( './auto-tailor.ts' );

const COPY = {} as SiteCopy;
const OUTPUT = { tasks: [] } as unknown as TailoredOutput;
const INFERRED = { goal: 'sell', site_name: 'Acme', description: 'Anvils' } as const;
const RESULT = { source: 'ai', output: OUTPUT } as TailorResult;

const data = ( extra: Partial< LaunchpadData > ): LaunchpadData =>
	( { tasks: [], ai_output: null, ...extra } ) as LaunchpadData;

/**
 * Builds injected options that serve the given responses in order.
 *
 * @param responses - The GET responses to return, one per poll.
 * @return The options and the recorded calls.
 */
function harness( responses: LaunchpadData[] ) {
	const calls = { fetches: 0, sleeps: [] as number[], tailored: [] as unknown[] };
	const options = {
		intervalMs: 7,
		maxPolls: 3,
		fetchData: async () => responses[ calls.fetches++ ],
		sleep: async ( ms: number ) => {
			calls.sleeps.push( ms );
		},
		tailorFn: async ( ...args: unknown[] ) => {
			calls.tailored.push( args );
			return RESULT;
		},
	};
	return { options, calls };
}

describe( 'buildAutoInput', () => {
	it( 'is null without inferred_input', () => {
		assert.equal( buildAutoInput( data( {} ) ), null );
	} );

	it( 'takes locale from the site and ui_locale from the user, each defaulting sensibly', () => {
		const withBoth = data( {
			inferred_input: INFERRED,
			site: { language: 'fr_FR' },
			user_language: 'it_IT',
		} );
		assert.deepEqual( buildAutoInput( withBoth ), {
			...INFERRED,
			locale: 'fr_FR',
			ui_locale: 'it_IT',
		} );

		const siteOnly = data( { inferred_input: INFERRED, site: { language: 'fr_FR' } } );
		assert.equal( buildAutoInput( siteOnly )?.ui_locale, 'fr_FR' );

		const neither = data( { inferred_input: INFERRED } );
		assert.equal( buildAutoInput( neither )?.locale, 'en' );
		assert.equal( buildAutoInput( neither )?.ui_locale, 'en' );
	} );
} );

describe( 'waitForTailoring', () => {
	it( 'resolves with the saved output, as ai unless it was a fallback', async () => {
		for ( const [ source, expected ] of [
			[ undefined, 'ai' ],
			[ 'ai', 'ai' ],
			[ 'fallback', 'fallback' ],
		] as const ) {
			const { options, calls } = harness( [
				data( { auto_tailoring: true } ),
				data( { ai_output: { payload: OUTPUT, source } } ),
			] );
			const result = await waitForTailoring( COPY, options );
			assert.deepEqual( result, { source: expected, output: OUTPUT } );
			assert.equal( calls.fetches, 2 );
			assert.deepEqual( calls.sleeps, [ 7, 7 ] );
			assert.equal( calls.tailored.length, 0 );
		}
	} );

	it( 'tailors itself when a poll hands it the input', async () => {
		const { options, calls } = harness( [ data( { inferred_input: INFERRED } ) ] );
		assert.equal( await waitForTailoring( COPY, options ), RESULT );
		assert.deepEqual( calls.tailored, [
			[ { ...INFERRED, locale: 'en', ui_locale: 'en' }, COPY, true ],
		] );
	} );

	it( 'keeps polling after a failed poll', async () => {
		let fetches = 0;
		const options = {
			intervalMs: 1,
			sleep: async () => {},
			fetchData: async () => {
				if ( fetches++ === 0 ) {
					throw new Error( 'offline' );
				}
				return data( { ai_output: { payload: OUTPUT } } );
			},
		};
		assert.deepEqual( await waitForTailoring( COPY, options ), { source: 'ai', output: OUTPUT } );
		assert.equal( fetches, 2 );
	} );

	it( 'rejects after maxPolls', async () => {
		const { options, calls } = harness( Array( 3 ).fill( data( { auto_tailoring: true } ) ) );
		await assert.rejects( waitForTailoring( COPY, options ) );
		assert.equal( calls.fetches, 3 );
	} );
} );
