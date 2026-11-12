import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	AGENT_OUTPUT_SCHEMA,
	MAX_REASONS_PER_ATTEMPT,
	parseAgentResponse,
	validateAgainstSchema,
} from './schema-validator.ts';

const fileSchema = JSON.parse(
	readFileSync(
		resolve(
			dirname( fileURLToPath( import.meta.url ) ),
			'../../contracts/agent-output-schema.json'
		),
		'utf8'
	)
);

interface AgentOutput {
	tasks: Array< { id: string; subtitle: string } >;
	inferred: Record< string, string >;
	first_post_draft: { title: string; paragraphs: string[] };
	about_page_draft: { title: string; paragraphs: string[] };
	page_intros?: Record< string, string | null >;
}

/**
 * A baseline schema-valid agent output for the cases below to edit.
 *
 * @return A valid TailoredOutput-shaped object.
 */
function validOutput(): AgentOutput {
	return {
		tasks: [
			{ id: 'first_post_published', subtitle: 'Write your first post.' },
			{ id: 'site_theme_selected', subtitle: 'Pick a theme.' },
			{ id: 'add_about_page', subtitle: 'Tell visitors who you are.' },
			{ id: 'complete_profile', subtitle: 'Complete your profile.' },
			{ id: 'drive_traffic', subtitle: 'Help people find you.' },
			{ id: 'site_launched', subtitle: 'Launch your site.' },
		],
		inferred: { goal: 'write', brand_name: 'Alpine Notes' },
		first_post_draft: {
			title: 'Trails worth remembering',
			paragraphs: [ 'First paragraph of the post.', 'Second paragraph of the post.' ],
		},
		about_page_draft: {
			title: 'About',
			paragraphs: [ 'Who is behind the site.', 'What visitors will find here.' ],
		},
	};
}

type Mutate = ( out: AgentOutput ) => unknown;

/**
 * Validate the baseline output with one edit applied.
 *
 * @param mutate - Applies the edit under test to a fresh baseline output.
 * @return The validation errors.
 */
function errorsAfter( mutate: Mutate ): string[] {
	const out = validOutput();
	mutate( out );
	return validateAgainstSchema( out, AGENT_OUTPUT_SCHEMA );
}

describe( 'inlined AGENT_OUTPUT_SCHEMA', () => {
	it( 'deep-equals the committed contract file', () => {
		// Strip annotation keywords from schema nodes only: inside `properties`, "title" is a real key.
		const META = [ '$schema', '$id', 'description', 'title' ];
		const stripMeta = ( node: unknown, isPropertyMap = false ): unknown => {
			if ( ! node || typeof node !== 'object' || Array.isArray( node ) ) {
				return node;
			}
			return Object.fromEntries(
				Object.entries( node )
					.filter( ( [ key ] ) => isPropertyMap || ! META.includes( key ) )
					.map( ( [ key, value ] ) => [
						key,
						stripMeta( value, ! isPropertyMap && key === 'properties' ),
					] )
			);
		};
		assert.deepEqual( AGENT_OUTPUT_SCHEMA, stripMeta( fileSchema ) );
	} );
} );

describe( 'validateAgainstSchema', () => {
	it( 'accepts a valid output', () => {
		assert.deepEqual( validateAgainstSchema( validOutput(), AGENT_OUTPUT_SCHEMA ), [] );
	} );

	const ACCEPTED: Array< [ string, Mutate ] > = [
		[ 'an inferred theme_category from the enum', out => ( out.inferred.theme_category = 'blog' ) ],
		[ 'a third About paragraph', out => out.about_page_draft.paragraphs.push( 'Come say hi.' ) ],
		[
			'an intro for every page task at once',
			out =>
				( out.page_intros = {
					add_contact_page: 'Say hello.',
					add_events_page: 'Come along.',
					add_video_page: 'Take a look.',
					add_gallery_page: 'A year of work.',
				} ),
		],
		[ 'an empty page_intros object', out => ( out.page_intros = {} ) ],
	];
	for ( const [ label, mutate ] of ACCEPTED ) {
		it( `accepts ${ label }`, () => assert.deepEqual( errorsAfter( mutate ), [] ) );
	}

	const REJECTED: Array< [ string, Mutate, string ] > = [
		[
			'fewer than 6 tasks',
			out => ( out.tasks = out.tasks.slice( 0, 5 ) ),
			'$.tasks: length 5 < minItems 6',
		],
		[
			'an empty subtitle',
			out => ( out.tasks[ 0 ].subtitle = '' ),
			'$.tasks[0].subtitle: length 0 < minLength 1',
		],
		[
			'additional properties',
			out => ( ( out as unknown as Record< string, unknown > ).extra = true ),
			'$.extra: additionalProperties:false but key present',
		],
		[
			'a missing required field',
			out => delete ( out as Partial< AgentOutput > ).first_post_draft,
			'$.first_post_draft: required, missing',
		],
		[
			'a fourth About paragraph',
			out => out.about_page_draft.paragraphs.push( 'C.', 'D.' ),
			'$.about_page_draft.paragraphs: length 4 > maxItems 3',
		],
	];
	for ( const [ label, mutate, error ] of REJECTED ) {
		it( `rejects ${ label }`, () => assert.deepEqual( errorsAfter( mutate ), [ error ] ) );
	}
} );

describe( 'parseAgentResponse', () => {
	it( 'returns the typed output for a valid JSON string', () => {
		assert.deepEqual( parseAgentResponse( JSON.stringify( validOutput() ) ), {
			output: validOutput(),
			errors: [],
		} );
	} );

	it( 'returns a fixed reason for malformed JSON, never the parser message', () => {
		assert.deepEqual( parseAgentResponse( 'Here is your plan: { not json' ), {
			output: null,
			errors: [ '$: invalid JSON' ],
		} );
	} );

	for ( const [ field, value ] of [
		[ 'inferred_goal', 'business' ],
		[ 'brand_name', 'x'.repeat( 81 ) ],
	] ) {
		it( `drops an invalid optional ${ field } instead of rejecting the output`, () => {
			const out = validOutput();
			out.inferred[ field ] = value;
			const { output } = parseAgentResponse( JSON.stringify( out ) );
			assert.ok( output );
			assert.equal( field in output.inferred, false );
		} );
	}

	const DROPPED_INTROS: Array< [ string, Record< string, string | null > ] > = [
		[
			'empty and null intros for page tasks the model did not choose',
			{
				add_contact_page: 'Say hello.',
				add_events_page: '',
				add_video_page: null,
				add_gallery_page: '',
			},
		],
		[
			'an intro for a task that has none',
			{ add_contact_page: 'Say hello.', add_about_page: 'Hi.' },
		],
	];
	for ( const [ label, page_intros ] of DROPPED_INTROS ) {
		it( `accepts ${ label }, leaving the key out`, () => {
			const { output, errors } = parseAgentResponse(
				JSON.stringify( { ...validOutput(), page_intros } )
			);
			assert.ok( output, errors.join( '; ' ) );
			assert.deepEqual( output.page_intros, { add_contact_page: 'Say hello.' } );
		} );
	}

	// Required fields keep failing: only optional keys are ever dropped.
	const REQUIRED_FAILURES: Array< [ string, Mutate, string ] > = [
		[
			'an out-of-enum required goal',
			out => ( out.inferred.goal = 'business' ),
			'inferred.goal: not in enum',
		],
		[
			'a null task subtitle',
			out => ( ( out.tasks[ 5 ] as { subtitle: unknown } ).subtitle = null ),
			'tasks[5].subtitle: expected string',
		],
		[
			'a page intro past the length ceiling',
			out => ( out.page_intros = { add_contact_page: 'x'.repeat( 201 ) } ),
			'page_intros.add_contact_page: length 201 > maxLength 200',
		],
	];
	for ( const [ label, mutate, reason ] of REQUIRED_FAILURES ) {
		it( `rejects ${ label }, and says why`, () => {
			const out = validOutput();
			mutate( out );
			assert.deepEqual( parseAgentResponse( JSON.stringify( out ) ), {
				output: null,
				errors: [ reason ],
			} );
		} );
	}

	it( 'never puts a field value in a reason', () => {
		const out = validOutput();
		out.inferred.goal = 'Private Bakery Name';
		out.tasks[ 0 ].subtitle = 'Ceramics from my studio at 12 Example Street. '.repeat( 5 );
		const { errors } = parseAgentResponse( JSON.stringify( out ) );
		assert.equal( errors.length, 2 );
		for ( const reason of errors ) {
			assert.equal( /Bakery|Ceramics|Example/.test( reason ), false, reason );
		}
	} );

	it( 'caps the reasons per reply, and strips odd characters from invented keys', () => {
		const out = validOutput() as unknown as Record< string, unknown >;
		out[ 'naïve "key" 🎉' ] = 1;
		out.extra_two = 2;
		out.extra_three = 3;
		out.extra_four = 4;
		const { errors } = parseAgentResponse( JSON.stringify( out ) );
		assert.equal( errors.length, MAX_REASONS_PER_ATTEMPT );
		assert.equal( errors[ 0 ], 'nave key : additionalProperties:false but key present' );
		for ( const reason of errors ) {
			assert.match( reason, /^[A-Za-z0-9_.$[\]:<>= -]{1,120}$/ );
		}
	} );
} );
