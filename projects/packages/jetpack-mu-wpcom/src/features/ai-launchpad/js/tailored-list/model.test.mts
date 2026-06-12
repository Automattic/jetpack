import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../lib/schema-validator.ts';
import { ctaKind, firstIncompleteIndex, resolveCtaUrl, tasksFromFixture } from './model.ts';
import type { EnrichedTask } from './model.ts';
import type { TailoredOutput } from '../lib/types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const schema = JSON.parse(
	readFileSync( resolve( CONTRACTS, 'agent-output-schema.json' ), 'utf8' )
);
const fixture = JSON.parse(
	readFileSync( resolve( __dirname, '../fixtures/dev-tailored-list.json' ), 'utf8' )
) as TailoredOutput;

/**
 * Build an enriched task with sensible defaults for the field under test.
 *
 * @param overrides - Fields to override.
 * @return An enriched task.
 */
function task( overrides: Partial< EnrichedTask > = {} ): EnrichedTask {
	return {
		id: 'site_theme_selected',
		subtitle: 'Pick a theme.',
		title: 'Choose a design',
		completed: false,
		calypso_path: '/themes/example.com',
		...overrides,
	};
}

describe( 'dev fixture', () => {
	it( 'validates against the agent output schema', () => {
		assert.deepEqual( validateAgainstSchema( fixture, schema ), [] );
	} );
} );

describe( 'ctaKind', () => {
	it( 'routes the first-post tasks to the post draft handler', () => {
		assert.equal( ctaKind( 'first_post_published' ), 'first_post' );
		assert.equal( ctaKind( 'first_post_published_newsletter' ), 'first_post' );
	} );

	it( 'routes page-creating tasks to the pattern page handler', () => {
		assert.equal( ctaKind( 'add_about_page' ), 'pattern_page' );
	} );

	it( 'routes everything else to a deeplink', () => {
		assert.equal( ctaKind( 'site_theme_selected' ), 'deeplink' );
		assert.equal( ctaKind( 'woo_launch_site' ), 'deeplink' );
	} );
} );

describe( 'resolveCtaUrl', () => {
	/**
	 * Build CtaHandlers that record the clicked task IDs and return marker URLs.
	 *
	 * @return The stub handlers and a record of clicked task IDs.
	 */
	function stubHandlers() {
		const clicked: string[] = [];
		return {
			clicked,
			handlers: {
				trackTaskClicked: ( props: { task_id: string } ) => clicked.push( props.task_id ),
				createFirstPostDraft: async () => ( { post_id: 1, edit_url: '/wp-admin/post.php?post=1' } ),
				createPatternPage: async () => ( { page_id: 2, edit_url: '/wp-admin/post.php?post=2' } ),
			},
		};
	}

	it( 'fires the Tracks event with the clicked task ID and deeplinks for plain tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'site_theme_selected', calypso_path: '/themes/x' } ),
			null,
			handlers
		);
		assert.equal( url, '/themes/x' );
		assert.deepEqual( clicked, [ 'site_theme_selected' ] );
	} );

	it( 'drafts a post and returns its editor URL for first-creation tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'first_post_published', calypso_path: null } ),
			fixture,
			handlers
		);
		assert.equal( url, '/wp-admin/post.php?post=1' );
		assert.deepEqual( clicked, [ 'first_post_published' ] );
	} );

	it( 'builds a pattern page and returns its editor URL for page tasks', async () => {
		const { clicked, handlers } = stubHandlers();
		const url = await resolveCtaUrl(
			task( { id: 'add_about_page', calypso_path: null } ),
			fixture,
			handlers
		);
		assert.equal( url, '/wp-admin/post.php?post=2' );
		assert.deepEqual( clicked, [ 'add_about_page' ] );
	} );
} );

describe( 'firstIncompleteIndex', () => {
	it( 'returns the first incomplete task index', () => {
		const tasks = [
			task( { id: 'a', completed: true } ),
			task( { id: 'b', completed: false } ),
			task( { id: 'c', completed: false } ),
		];
		assert.equal( firstIncompleteIndex( tasks ), 1 );
	} );

	it( 'returns 0 when nothing is complete', () => {
		const tasks = [ task( { id: 'a' } ), task( { id: 'b' } ) ];
		assert.equal( firstIncompleteIndex( tasks ), 0 );
	} );

	it( 'returns -1 when everything is complete', () => {
		const tasks = [ task( { id: 'a', completed: true } ), task( { id: 'b', completed: true } ) ];
		assert.equal( firstIncompleteIndex( tasks ), -1 );
	} );
} );

describe( 'tasksFromFixture', () => {
	it( 'derives six incomplete tasks with humanized titles from the fixture', () => {
		const derived = tasksFromFixture( fixture );
		assert.equal( derived.length, 6 );
		assert.ok( derived.every( t => t.completed === false ) );
		assert.equal( derived[ 0 ].id, 'woo_products' );
		assert.equal( derived[ 0 ].title, 'Woo Products' );
		assert.equal( derived[ 0 ].subtitle, fixture.tasks[ 0 ].subtitle );
	} );
} );
