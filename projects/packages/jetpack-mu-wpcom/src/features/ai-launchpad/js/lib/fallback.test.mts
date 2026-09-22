import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { selectFallback } from './fallback.ts';
import { validateAgainstSchema } from './schema-validator.ts';
import { ENGLISH_SITE_COPY } from './site-copy.fixture.mts';
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
	return {
		goal,
		site_name: 'Test Site',
		description: 'A test description.',
		locale: 'en',
		ui_locale: 'en',
	};
}

describe( 'selectFallback', () => {
	for ( const goal of GOALS ) {
		it( `produces schema-valid output for goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ), ENGLISH_SITE_COPY );
			const errors = validateAgainstSchema( output, fileSchema );
			assert.deepEqual( errors, [], `expected no schema errors, got: ${ errors.join( '; ' ) }` );
		} );

		it( `emits 6 subtitled tasks, launch last, echoing goal "${ goal }"`, () => {
			const output = selectFallback( inputFor( goal ), ENGLISH_SITE_COPY );
			assert.equal( output.tasks.length, 6 );
			const last = output.tasks[ output.tasks.length - 1 ];
			assert.ok( LAUNCH_TASKS.has( last.id ), `last task "${ last.id }" is not a launch task` );
			for ( const task of output.tasks ) {
				assert.ok( task.subtitle.length > 0, `task "${ task.id }" has an empty subtitle` );
			}
			assert.equal( output.inferred.goal, goal );
		} );
	}

	it( 'leads the sell sequence with store customization then products', () => {
		const ids = selectFallback( inputFor( 'sell' ), ENGLISH_SITE_COPY ).tasks.map(
			task => task.id
		);
		assert.deepEqual( ids.slice( 0, 2 ), [ 'woo_customize_store', 'woo_products' ] );
	} );

	it( 'clamps an over-long site name to stay schema-valid', () => {
		const longName = 'X'.repeat( 200 );
		const output = selectFallback(
			{
				goal: 'write',
				site_name: longName,
				description: 'desc',
				locale: 'en',
				ui_locale: 'en',
			},
			ENGLISH_SITE_COPY
		);
		const errors = validateAgainstSchema( output, fileSchema );
		assert.deepEqual( errors, [], `expected no schema errors, got: ${ errors.join( '; ' ) }` );
	} );

	it( 'writes the drafts from the site copy with the site name filled in', () => {
		const output = selectFallback( inputFor( 'write' ), ENGLISH_SITE_COPY );

		assert.equal( output.first_post_draft.title, 'Getting started with Test Site' );
		assert.equal( output.first_post_draft.subtitle, 'Introduce Test Site to your readers.' );
		assert.match(
			output.first_post_draft.paragraphs[ 0 ],
			/^This is the first post on Test Site\./
		);
		assert.equal( output.about_page_draft?.title, 'About' );
		assert.match( output.about_page_draft?.paragraphs[ 0 ] ?? '', /story of Test Site begins/ );
	} );

	it( 'substitutes the copy’s generic name for a blank site name', () => {
		const output = selectFallback( { ...inputFor( 'write' ), site_name: '  ' }, ENGLISH_SITE_COPY );

		assert.equal( output.first_post_draft.title, 'Getting started with your new site' );
	} );

	it( 'follows translated copy, including a reordered placeholder', () => {
		// The copy arrives already translated; the fallback only fills the name in, wherever the
		// translator put the placeholder.
		const output = selectFallback( inputFor( 'write' ), {
			...ENGLISH_SITE_COPY,
			about_page_title: 'Chi siamo',
			fallback_post_title: 'Primi passi con %1$s',
			fallback_about_paragraphs: [ 'Qui inizia la storia di %s.', 'Raccontaci di più.' ],
		} );

		assert.deepEqual( validateAgainstSchema( output, fileSchema ), [] );
		assert.equal( output.first_post_draft.title, 'Primi passi con Test Site' );
		assert.equal( output.about_page_draft?.title, 'Chi siamo' );
		assert.deepEqual( output.about_page_draft?.paragraphs, [
			'Qui inizia la storia di Test Site.',
			'Raccontaci di più.',
		] );
	} );

	it( 'still fills the site name in when a translation breaks sprintf', () => {
		const output = selectFallback( inputFor( 'write' ), {
			...ENGLISH_SITE_COPY,
			fallback_post_title: 'Getting started with %s: 100% yours',
		} );

		assert.equal( output.first_post_draft.title, 'Getting started with Test Site: 100% yours' );
	} );
} );
