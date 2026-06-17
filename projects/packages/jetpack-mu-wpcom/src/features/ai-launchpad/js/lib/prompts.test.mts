import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTailorPrompt, TASK_MENU } from './prompts.ts';
import type { WizardInput } from './types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const fixtures = JSON.parse( readFileSync( resolve( CONTRACTS, 'eval-fixtures.json' ), 'utf8' ) )
	.fixtures as Array< { name: string; input: WizardInput } >;

describe( 'buildTailorPrompt', () => {
	for ( const fixture of fixtures ) {
		it( `interpolates goal, site_name, and description for "${ fixture.name }"`, () => {
			const prompt = buildTailorPrompt( fixture.input );
			assert.ok( prompt.includes( fixture.input.goal ), 'goal missing from prompt' );
			assert.ok( prompt.includes( fixture.input.site_name ), 'site_name missing from prompt' );
			assert.ok( prompt.includes( fixture.input.description ), 'description missing from prompt' );
		} );
	}

	it( 'lists every menu task ID', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input );
		for ( const id of TASK_MENU ) {
			assert.ok( prompt.includes( id ), `menu ID "${ id }" missing from prompt` );
		}
	} );

	it( 'instructs the model to return only JSON', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input );
		assert.ok( /return only a json object/i.test( prompt ) );
	} );

	// The eval runner lives under the gitignored docs/ tree, so it's only present
	// in the main checkout — skip this cross-artifact check where it's absent
	// (CI, fresh clones, worktrees) rather than throwing ENOENT.
	const evalRunnerPath = resolve( __dirname, '../../docs/bin/eval-ai-launchpad.mjs' );
	it(
		'matches the eval runner TASK_MENU exactly',
		{
			skip: existsSync( evalRunnerPath ) ? false : 'eval runner not present (docs/ is gitignored)',
		},
		() => {
			const evalSource = readFileSync( evalRunnerPath, 'utf8' );
			for ( const id of TASK_MENU ) {
				assert.ok( evalSource.includes( `'${ id }'` ), `eval runner missing menu ID "${ id }"` );
			}
		}
	);
} );
