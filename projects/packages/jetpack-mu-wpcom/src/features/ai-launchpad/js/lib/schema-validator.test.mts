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
import type { TailoredOutput } from './types.ts';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const CONTRACTS = resolve( __dirname, '../../contracts' );

const fileSchema = JSON.parse(
	readFileSync( resolve( CONTRACTS, 'agent-output-schema.json' ), 'utf8' )
);

interface AgentOutput {
	tasks: Array< { id: string; subtitle: string } >;
	inferred: Record< string, string >;
	first_post_draft: { title: string; paragraphs: string[] };
	about_page_draft: { title: string; paragraphs: string[] };
	page_intros?: Record< string, string >;
}

/**
 * A baseline schema-valid agent output used as the basis for mutation tests.
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

/** A named edit to the baseline output, and the behaviour it is meant to trigger. */
type Mutation = [ label: string, mutate: ( out: AgentOutput ) => unknown ];

/**
 * Drop a required top-level field, for the "missing field" cases.
 *
 * @param out - The output to edit.
 * @param key - The field to remove.
 * @return True, as `delete` always does here.
 */
const without = ( out: AgentOutput, key: keyof AgentOutput ) =>
	delete ( out as Partial< AgentOutput > )[ key ];

/**
 * Validate the baseline output with one mutation applied.
 *
 * @param mutate - Applies the mutation under test to a fresh baseline output.
 * @return The validation errors.
 */
function errorsAfter( mutate: ( out: AgentOutput ) => unknown ): string[] {
	const out = validOutput();
	mutate( out );
	return validateAgainstSchema( out, fileSchema );
}

describe( 'inlined AGENT_OUTPUT_SCHEMA', () => {
	it( 'deep-equals the committed contract file', () => {
		// Strip the JSON-Schema annotation keywords the inlined constant omits, so the structural
		// keywords can be compared. Only schema nodes carry them: the keys one level inside
		// `properties` are property names, and "title" is a real one, so those are left intact.
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
		assert.deepEqual( validateAgainstSchema( validOutput(), fileSchema ), [] );
	} );

	// Optional additions the schema allows. The baseline omits every one of these fields, so
	// the accepting cases double as proof that they are optional.
	const ACCEPTED: Mutation[] = [
		[ 'an inferred theme_category from the enum', out => ( out.inferred.theme_category = 'blog' ) ],
		[ 'an inferred_goal from the enum', out => ( out.inferred.inferred_goal = 'portfolio' ) ],
		[ 'a third About paragraph', out => out.about_page_draft.paragraphs.push( 'Come say hi.' ) ],
		// page_intros is optional as a whole, and every key inside it is optional too: the model
		// writes one only for a page task it actually chose, so an empty object is a valid "chose
		// none" and the baseline's omission of the field is the pre-change persisted output.
		[ 'a contact-page intro', out => ( out.page_intros = { add_contact_page: 'Say hello.' } ) ],
		[ 'an events-page intro', out => ( out.page_intros = { add_events_page: 'Come along.' } ) ],
		[ 'a video-page intro', out => ( out.page_intros = { add_video_page: 'Take a look.' } ) ],
		[
			'a gallery-page intro',
			out => ( out.page_intros = { add_gallery_page: 'A year of work.' } ),
		],
		// All at once: the keys are independent, so a run that picked several page tasks writes several.
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

	const REJECTED: Mutation[] = [
		[ 'fewer than 6 tasks', out => ( out.tasks = out.tasks.slice( 0, 5 ) ) ],
		[ 'an empty subtitle', out => ( out.tasks[ 0 ].subtitle = '' ) ],
		[ 'an out-of-enum theme_category slug', out => ( out.inferred.theme_category = 'hiking' ) ],
		[ 'an out-of-enum inferred_goal', out => ( out.inferred.inferred_goal = 'cook' ) ],
		[ 'an unknown goal enum value', out => ( out.inferred.goal = 'cook' ) ],
		[
			'additional properties',
			out => ( ( out as unknown as Record< string, unknown > ).extra = true ),
		],
		[ 'a missing required field', out => without( out, 'first_post_draft' ) ],
		[ 'a missing about_page_draft', out => without( out, 'about_page_draft' ) ],
		[ 'a fourth About paragraph', out => out.about_page_draft.paragraphs.push( 'C.', 'D.' ) ],
		// The keys are task ids the client knows how to place, so an invented one is a page nothing
		// will ever render. Rejecting it is the same call the other objects here already make.
		[ 'a page intro for an unknown task', out => ( out.page_intros = { add_faq_page: 'Hi.' } ) ],
		[
			'a page intro past the subtitle-length ceiling',
			out => ( out.page_intros = { add_contact_page: 'x'.repeat( 201 ) } ),
		],
		[ 'an empty page intro', out => ( out.page_intros = { add_contact_page: '' } ) ],
		[
			'an events-page intro past the subtitle-length ceiling',
			out => ( out.page_intros = { add_events_page: 'x'.repeat( 201 ) } ),
		],
		[
			'a video-page intro past the subtitle-length ceiling',
			out => ( out.page_intros = { add_video_page: 'x'.repeat( 201 ) } ),
		],
		[
			'a gallery-page intro past the subtitle-length ceiling',
			out => ( out.page_intros = { add_gallery_page: 'x'.repeat( 201 ) } ),
		],
	];
	for ( const [ label, mutate ] of REJECTED ) {
		it( `rejects ${ label }`, () => assert.ok( errorsAfter( mutate ).length > 0 ) );
	}
} );

describe( 'parseAgentResponse', () => {
	it( 'returns the typed output for a valid JSON string', () => {
		const { output, errors } = parseAgentResponse( JSON.stringify( validOutput() ) );
		assert.ok( output );
		assert.equal( output.tasks.length, 6 );
		assert.deepEqual( errors, [] );
	} );

	it( 'returns a fixed reason for malformed JSON, never the parser message', () => {
		// V8's SyntaxError message quotes the offending text, which is the model's reply.
		assert.deepEqual( parseAgentResponse( 'Here is your plan: { not json' ), {
			output: null,
			errors: [ '$: invalid JSON' ],
		} );
	} );

	for ( const [ field, value ] of [
		[ 'inferred_goal', 'business' ],
		[ 'theme_category', 'hiking' ],
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

	// Models spell "leave this out" as null or "". Each of these used to throw an otherwise complete
	// output away into a retry; now the empty optional key is removed before validation.
	const loose = ( value: unknown ) => value as Record< string, unknown >;
	const EMPTY_OPTIONAL: Array<
		[
			label: string,
			mutate: ( out: AgentOutput ) => unknown,
			check: ( output: TailoredOutput ) => void,
		]
	> = [
		[
			'a null first_post_draft subtitle',
			out => ( loose( out.first_post_draft ).subtitle = null ),
			output => assert.equal( 'subtitle' in output.first_post_draft, false ),
		],
		[
			'an empty first_post_draft subtitle',
			out => ( loose( out.first_post_draft ).subtitle = '' ),
			output => assert.equal( 'subtitle' in output.first_post_draft, false ),
		],
		[
			'a null page_intros',
			out => ( loose( out ).page_intros = null ),
			output => assert.equal( 'page_intros' in output, false ),
		],
		[
			'an empty page_intros string',
			out => ( loose( out ).page_intros = '' ),
			output => assert.equal( 'page_intros' in output, false ),
		],
		[
			'empty and null intros for page tasks the model did not choose',
			out =>
				( loose( out ).page_intros = {
					add_contact_page: 'Say hello.',
					add_events_page: '',
					add_video_page: null,
					add_gallery_page: '',
				} ),
			output => assert.deepEqual( output.page_intros, { add_contact_page: 'Say hello.' } ),
		],
		[
			'an intro for a task that has none',
			out => ( out.page_intros = { add_contact_page: 'Say hello.', add_about_page: 'Hi.' } ),
			output => assert.deepEqual( output.page_intros, { add_contact_page: 'Say hello.' } ),
		],
		[
			'a null optional inferred field',
			out => ( loose( out.inferred ).vibe = null ),
			output => assert.equal( 'vibe' in output.inferred, false ),
		],
	];
	for ( const [ label, mutate, check ] of EMPTY_OPTIONAL ) {
		it( `accepts ${ label }, leaving the key out`, () => {
			const out = validOutput();
			mutate( out );
			const { output, errors } = parseAgentResponse( JSON.stringify( out ) );
			assert.ok( output, errors.join( '; ' ) );
			check( output );
		} );
	}

	// Required fields keep failing: only optional keys are ever dropped.
	for ( const [ label, mutate, reason ] of [
		[
			'too few tasks',
			out => ( out.tasks = out.tasks.slice( 0, 3 ) ),
			'tasks: length 3 < minItems 6',
		],
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
			'an empty task subtitle',
			out => ( out.tasks[ 0 ].subtitle = '' ),
			'tasks[0].subtitle: length 0 < minLength 1',
		],
		[
			'a null first_post_draft title',
			out => ( ( out.first_post_draft as { title: unknown } ).title = null ),
			'first_post_draft.title: expected string',
		],
		[
			'a null required inferred goal',
			out => ( ( out.inferred as Record< string, unknown > ).goal = null ),
			'inferred.goal: expected string',
		],
		[
			'a page intro past the length ceiling',
			out => ( out.page_intros = { add_contact_page: 'x'.repeat( 201 ) } ),
			'page_intros.add_contact_page: length 201 > maxLength 200',
		],
	] as Array< [ string, ( out: AgentOutput ) => unknown, string ] > ) {
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
