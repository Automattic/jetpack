import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	AGENT_OUTPUT_SCHEMA,
	parseAgentResponse,
	validateAgainstSchema,
} from './schema-validator.ts';

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
		const parsed = parseAgentResponse( JSON.stringify( validOutput() ) );
		assert.ok( parsed );
		assert.equal( parsed.tasks.length, 6 );
	} );

	it( 'returns null for malformed JSON', () => {
		assert.equal( parseAgentResponse( '{ not json' ), null );
	} );

	it( 'returns null for schema-invalid JSON', () => {
		const out = validOutput();
		out.tasks = out.tasks.slice( 0, 3 );
		assert.equal( parseAgentResponse( JSON.stringify( out ) ), null );
	} );
} );
