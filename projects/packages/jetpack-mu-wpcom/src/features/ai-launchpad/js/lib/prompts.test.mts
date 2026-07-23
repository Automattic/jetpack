import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTailorPrompt, chooseTailoringMenu, TASK_MENU } from './prompts.ts';
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

	it( 'offers only the actionable theme task, not the legacy design tasks', () => {
		// design_selected is always-complete and design_completed has no wp-admin
		// completion path; both are consolidated onto site_theme_selected.
		assert.ok( TASK_MENU.includes( 'site_theme_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_completed' ) );
	} );

	it( 'restricts the offered menu to the available tasks when given', () => {
		const available = [ 'first_post_published', 'site_theme_selected', 'site_launched' ];
		const prompt = buildTailorPrompt( fixtures[ 0 ].input, available );
		// A menu section lists only the available ids...
		for ( const id of available ) {
			assert.ok( prompt.includes( '- ' + id ), `available ID "${ id }" missing from menu` );
		}
		// ...and a menu-only task that is not available is dropped from the list.
		const dropped = TASK_MENU.find( id => ! available.includes( id ) ) as string;
		assert.ok(
			! prompt.includes( '- ' + dropped ),
			`unavailable ID "${ dropped }" should be dropped`
		);
	} );

	it( 'falls back to the full menu when the available list is empty', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input, [] );
		for ( const id of TASK_MENU ) {
			assert.ok( prompt.includes( '- ' + id ), `menu ID "${ id }" missing from prompt` );
		}
	} );

	it( 'offers the actionable ids while enough of them remain on the menu', () => {
		const actionable = TASK_MENU.slice( 0, 12 );
		const renderable = [ ...actionable, 'first_post_published_extra' ];
		assert.equal( chooseTailoringMenu( actionable, renderable ), actionable );
	} );

	it( 'relaxes to the renderable ids when completion leaves too few actionable menu tasks', () => {
		// Ids off the menu do not count toward the threshold: the prompt's menu is the intersection.
		const actionable = [ ...TASK_MENU.slice( 0, 4 ), 'off_menu_task_a', 'off_menu_task_b' ];
		const renderable = TASK_MENU.slice( 0, 20 );
		assert.equal( chooseTailoringMenu( actionable, renderable ), renderable );
	} );

	it( 'instructs the model to return only JSON', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input );
		assert.ok( /return only a json object/i.test( prompt ) );
	} );

	it( 'asks for a diagnostic inferred_goal that must not influence the output', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input );
		assert.ok( prompt.includes( '"inferred_goal"' ), 'inferred_goal missing from prompt' );
		// The field is analytics-only; the prompt must tell the model to keep it
		// out of its task selection.
		assert.ok(
			/must NOT influence/.test( prompt ),
			'no-influence instruction missing from prompt'
		);
	} );

	it( 'asks for a theme_category chosen from the showcase subject slugs', () => {
		const prompt = buildTailorPrompt( fixtures[ 0 ].input );
		assert.ok( prompt.includes( '"theme_category"' ), 'theme_category missing from prompt' );
		// The full slug menu must be in the prompt, and the instruction must steer the
		// model toward the specific subject over the generic goal bucket.
		assert.ok(
			prompt.includes( 'travel-lifestyle' ) && prompt.includes( 'community-non-profit' ),
			'category slugs missing from prompt'
		);
		assert.ok( /specific subject/i.test( prompt ), 'subject-over-bucket guidance missing' );
	} );
} );

describe( 'buildTailorPrompt output language', () => {
	const base = fixtures[ 0 ].input;

	it( 'keeps the prompt byte-identical for English locales', () => {
		const reference = buildTailorPrompt( base ); // fixture locale is "en"
		for ( const locale of [ 'en', 'en_US', 'en-gb', 'en_AU' ] ) {
			assert.equal( buildTailorPrompt( { ...base, locale } ), reference );
		}
		assert.ok( ! reference.includes( 'output language' ) );
	} );

	it( 'adds the output-language section for non-English locales', () => {
		const prompt = buildTailorPrompt( { ...base, locale: 'it_IT' } );
		assert.ok( prompt.includes( '============ output language ============' ) );
		assert.ok( prompt.includes( 'Italian' ), 'resolved language name missing' );
		assert.ok( prompt.includes( 'Keep these in English verbatim' ), 'slug carve-out missing' );
	} );

	it( 'swaps "Plain English" for the target language', () => {
		assert.ok( buildTailorPrompt( base ).includes( 'Plain English, no jargon' ) );
		const prompt = buildTailorPrompt( { ...base, locale: 'it_IT' } );
		assert.ok( ! prompt.includes( 'Plain English, no jargon' ) );
		assert.ok( /Plain Italian[^,]*, no jargon/.test( prompt ) );
	} );

	it( 'asks for the target-language equivalent of the About title', () => {
		assert.ok( buildTailorPrompt( base ).includes( 'Usually just "About" or "About" plus' ) );
		const prompt = buildTailorPrompt( { ...base, locale: 'de_DE' } );
		assert.ok( prompt.includes( 'equivalent of "About"' ) );
	} );

	it( 'falls back to the raw code when the locale cannot be resolved', () => {
		const prompt = buildTailorPrompt( { ...base, locale: '!!invalid!!' } );
		assert.ok( prompt.includes( '!!invalid!!' ) );
	} );
} );
