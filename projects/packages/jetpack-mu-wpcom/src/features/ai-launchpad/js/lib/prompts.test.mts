import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildTailorPrompt, chooseTailoringMenu, TASK_ANNOTATIONS, TASK_MENU } from './prompts.ts';
import type { WizardInput } from './types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const fixtures = JSON.parse( readFileSync( resolve( CONTRACTS, 'eval-fixtures.json' ), 'utf8' ) )
	.fixtures as Array< { name: string; input: WizardInput } >;

const INPUT: WizardInput = fixtures[ 0 ].input;

describe( 'TASK_ANNOTATIONS', () => {
	it( 'has no duplicate ids', () => {
		assert.equal( new Set( TASK_MENU ).size, TASK_MENU.length );
	} );

	it( 'gives every entry a non-empty what and pick when', () => {
		for ( const entry of TASK_ANNOTATIONS ) {
			assert.ok( entry.what.length > 0, `${ entry.id } is missing "what"` );
			assert.ok( entry.pickWhen.length > 0, `${ entry.id } is missing "pickWhen"` );
		}
	} );

	it( 'offers the foundation registry tasks to every goal', () => {
		// Both suit any site, so a goals line would be narrower than the (absent) PHP rule and would
		// suppress them for goals they are perfectly good on.
		for ( const id of [ 'add_site_icon', 'pick_fonts_colors' ] ) {
			const entry = TASK_ANNOTATIONS.find( annotation => annotation.id === id );
			assert.ok( entry, `${ id } must be on the menu` );
			assert.equal( entry.goals, undefined, `${ id } must carry no goal affinity` );
		}
	} );

	it( 'distinguishes the design-ish tasks from one another', () => {
		// The reason the model fell back to the same three: nothing in the menu said how they differ.
		// Each of these has to name a distinct surface, or a new alternative buys nothing.
		const byId = Object.fromEntries( TASK_ANNOTATIONS.map( entry => [ entry.id, entry ] ) );

		assert.match( byId.site_theme_selected.what, /theme showcase/i );
		assert.match( byId.design_edited.what, /Site Editor/i );
		assert.match( byId.front_page_updated.what, /homepage/i );
		assert.match( byId.pick_fonts_colors.what, /style variation/i );
		assert.match( byId.add_site_icon.what, /logo|icon/i );
	} );

	it( 'names the plugin in the discovery task and gives it no goal affinity', () => {
		// The pick is the personalization here, so the model has to be able to tell what the plugin is —
		// an entry that does not name it is the bare-id problem again. And the niche that decides (teaching
		// a structured course) is not what the goal slug tracks, so a goals line would suppress the task
		// for exactly the sites it exists to reach.
		const sensei = TASK_ANNOTATIONS.find( entry => entry.id === 'install_sensei_lms' );

		assert.ok( sensei, 'install_sensei_lms must be on the menu' );
		assert.match( sensei.what, /Sensei/ );
		assert.equal( sensei.goals, undefined );
	} );

	it( 'keeps the generic plugin task pointed at what no other task names', () => {
		// It is the only remaining route to the wider directory, so its pick when has to describe that role
		// rather than read as the leftover of a set of named-plugin tasks.
		const generic = TASK_ANNOTATIONS.find( entry => entry.id === 'install_custom_plugin' );

		assert.ok( generic, 'install_custom_plugin must be on the menu' );
		assert.match( generic.pickWhen, /no other task names it/ );
		assert.ok( generic.avoidWhen?.includes( 'install_sensei_lms' ) );
	} );

	it( 'offers the gallery task and gives it no goal affinity', () => {
		const gallery = TASK_ANNOTATIONS.find( entry => entry.id === 'add_gallery_page' );

		assert.ok( gallery, 'add_gallery_page must be on the menu' );
		// A goal affinity would suppress the gallery for the sites it exists to reach: a photographer or food
		// blogger picks `write`. Whether the site is visual is the criterion, and pickWhen carries it.
		assert.equal( gallery.goals, undefined );
	} );
} );

describe( 'buildTailorPrompt', () => {
	for ( const fixture of fixtures ) {
		it( `interpolates goal, site_name, and description for "${ fixture.name }"`, () => {
			const prompt = buildTailorPrompt( fixture.input );
			assert.ok( prompt.includes( fixture.input.goal ), 'goal missing from prompt' );
			assert.ok( prompt.includes( fixture.input.site_name ), 'site_name missing from prompt' );
			assert.ok( prompt.includes( fixture.input.description ), 'description missing from prompt' );
		} );
	}

	it( 'offers only the actionable theme task, not the legacy design tasks', () => {
		// design_selected is always-complete and design_completed has no wp-admin
		// completion path; both are consolidated onto site_theme_selected.
		assert.ok( TASK_MENU.includes( 'site_theme_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_selected' ) );
		assert.ok( ! TASK_MENU.includes( 'design_completed' ) );
	} );

	it( 'renders each offered task as an annotated block, not a bare id', () => {
		const prompt = buildTailorPrompt( INPUT, [ 'first_post_published', 'site_launched' ] );

		assert.match( prompt, /- id: first_post_published\n {2}what: .+\n {2}pick when: .+/ );
	} );

	it( 'restricts the offered menu to the available tasks when given', () => {
		const available = [ 'first_post_published', 'site_theme_selected', 'site_launched' ];
		const prompt = buildTailorPrompt( INPUT, available );
		// A menu section lists only the available ids...
		for ( const id of available ) {
			assert.ok( prompt.includes( '- id: ' + id ), `available ID "${ id }" missing from menu` );
		}
		// ...and a menu-only task that is not available is dropped from the list.
		const dropped = TASK_MENU.find( id => ! available.includes( id ) ) as string;
		assert.ok(
			! prompt.includes( '- id: ' + dropped ),
			`unavailable ID "${ dropped }" should be dropped`
		);
	} );

	it( 'falls back to the full menu when availability is unknown', () => {
		const prompt = buildTailorPrompt( INPUT, [] );

		for ( const id of TASK_MENU ) {
			assert.ok( prompt.includes( `- id: ${ id }` ), `${ id } missing from full menu` );
		}
	} );

	it( 'renders optional fields only when present', () => {
		const withAvoid = TASK_ANNOTATIONS.find( entry => entry.avoidWhen );
		const withoutAvoid = TASK_ANNOTATIONS.find( entry => ! entry.avoidWhen );
		assert.ok( withAvoid && withoutAvoid, 'table needs both shapes to exercise this' );

		const prompt = buildTailorPrompt( INPUT, [ withAvoid.id, withoutAvoid.id ] );
		const blocks = prompt.split( '- id: ' );
		const plainBlock = blocks.find( block => block.startsWith( `${ withoutAvoid.id }\n` ) );

		assert.ok( prompt.includes( `  avoid when: ${ withAvoid.avoidWhen }` ) );
		assert.ok( plainBlock && ! plainBlock.includes( 'avoid when:' ) );
	} );

	it( 'no longer carries the goal rules that PHP now enforces', () => {
		const prompt = buildTailorPrompt( INPUT, [] );

		assert.ok( ! prompt.includes( 'if the goal is sell OR' ) );
		assert.ok( ! prompt.includes( 'if the goal is newsletter OR' ) );
		assert.ok( ! prompt.includes( 'order the commerce tasks store-first' ) );
	} );

	it( 'lists only server-enforced rules under the HARD RULES header', () => {
		// The header promises the model that violations are rejected, so an unenforced rule here claims
		// an authority the code does not back. Pinned to the exact strings, not just the count: swapping
		// an enforced rule for a demoted one keeps the count at four and would otherwise pass.
		//
		// The first rule points at the menu but promises only what update_tailored() actually checks:
		// that the server can build the id, from the shared catalog or from its own registry. An id
		// from either that the menu filter left off is still accepted.
		const prompt = buildTailorPrompt( INPUT, [] );
		const block = prompt.slice( prompt.indexOf( 'HARD RULES' ) ).split( '\n\n' )[ 0 ];
		const bullets = block.split( '\n' ).filter( line => line.startsWith( '- ' ) );

		assert.deepEqual( bullets, [
			'- Every "id" MUST be copied verbatim from the menu below. Never invent IDs: the server drops any id it cannot recognize, and rejects the whole list if too few tasks survive.',
			'- Return exactly 6 tasks.',
			'- The 6th and final task MUST be a launch task: "site_launched" (canonical) or "blog_launched".',
			'- Subtitles must be plain text: no URLs, no HTML, and no template syntax such as {{ }} or [[ ]].',
		] );
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

	// Instructions the rest of the pipeline depends on; each needle is the load-bearing part.
	const REQUIRED: Array< [ string, Array< string | RegExp > ] > = [
		[ 'instructs the model to return only JSON', [ /return only a json object/i ] ],
		// inferred_goal is analytics-only, so the prompt must also tell the model to keep it out
		// of its task selection.
		[
			'asks for a diagnostic inferred_goal that must not influence the output',
			[ '"inferred_goal"', /must NOT influence/ ],
		],
		// The full slug menu must be in the prompt, and the instruction must steer the model
		// toward the specific subject over the generic goal bucket.
		[
			'asks for a theme_category chosen from the showcase subject slugs',
			[ '"theme_category"', 'travel-lifestyle', 'community-non-profit', /specific subject/i ],
		],
	];
	for ( const [ name, needles ] of REQUIRED ) {
		it( name, () => {
			const prompt = buildTailorPrompt( INPUT );
			for ( const needle of needles ) {
				const found =
					typeof needle === 'string' ? prompt.includes( needle ) : needle.test( prompt );
				assert.ok( found, `missing from prompt: ${ needle }` );
			}
		} );
	}
} );
