import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectFallback } from './fallback.ts';
import { validateAgainstSchema } from './schema-validator.ts';
import type { GoalSlug, WizardInput } from './types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const fileSchema = JSON.parse(
	readFileSync( resolve( CONTRACTS, 'agent-output-schema.json' ), 'utf8' )
);

const LAUNCH_TASKS = new Set( [
	'site_launched',
	'blog_launched',
	'link_in_bio_launched',
	'videopress_launched',
] );

const GOALS: GoalSlug[] = [ 'write', 'build', 'sell', 'newsletter', 'educate', 'portfolio' ];

/**
 * Build a minimal wizard input for a goal.
 *
 * @param goal - The wizard goal.
 * @return The wizard input.
 */
function inputFor( goal: GoalSlug ): WizardInput {
	return { goal, site_name: 'Test Site', description: 'A test description.', locale: 'en' };
}

describe( 'selectFallback', () => {
	for ( const goal of GOALS ) {
		it( `produces schema-valid output for goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ) );
			const errors = validateAgainstSchema( output, fileSchema );
			assert.deepEqual( errors, [], `expected no schema errors, got: ${ errors.join( '; ' ) }` );
		} );

		it( `emits exactly 6 tasks with a launch task last for goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ) );
			assert.equal( output.tasks.length, 6 );
			const last = output.tasks[ output.tasks.length - 1 ];
			assert.ok( LAUNCH_TASKS.has( last.id ), `last task "${ last.id }" is not a launch task` );
		} );

		it( `gives every task a non-empty subtitle for goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ) );
			for ( const task of output.tasks ) {
				assert.ok( task.subtitle.length > 0, `task "${ task.id }" has an empty subtitle` );
			}
		} );

		it( `echoes the goal into inferred for goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ) );
			assert.equal( output.inferred.goal, goal );
		} );
	}

	it( 'leads the sell sequence with store customization then products', () => {
		const ids = selectFallback( inputFor( 'sell' ) ).tasks.map( task => task.id );
		assert.deepEqual( ids.slice( 0, 2 ), [ 'woo_customize_store', 'woo_products' ] );
	} );

	it( 'clamps an over-long site name to stay schema-valid', () => {
		const longName = 'X'.repeat( 200 );
		const output = selectFallback( {
			goal: 'write',
			site_name: longName,
			description: 'desc',
			locale: 'en',
		} );
		const errors = validateAgainstSchema( output, fileSchema );
		assert.deepEqual( errors, [], `expected no schema errors, got: ${ errors.join( '; ' ) }` );
	} );

	it( 'validates against the schema-validator inlined constant too', () => {
		// The inlined AGENT_OUTPUT_SCHEMA must agree with the committed file.
		const output = selectFallback( inputFor( 'sell' ) );
		assert.deepEqual( validateAgainstSchema( output, fileSchema ), [] );
	} );
} );
