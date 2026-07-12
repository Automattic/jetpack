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

/**
 * A baseline schema-valid agent output used as the basis for mutation tests.
 *
 * @return A valid TailoredOutput-shaped object.
 */
function validOutput() {
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
	};
}

describe( 'inlined AGENT_OUTPUT_SCHEMA', () => {
	it( 'deep-equals the committed contract file', () => {
		// Strip the JSON-Schema annotation keywords the inlined constant omits
		// ($schema/$id/description, and the root title) so the structural
		// keywords can be compared. "title" is only an annotation at the root;
		// inside `properties` it is a real property name, so it is left intact.
		const META = new Set( [ '$schema', '$id', 'description' ] );
		const stripMeta = (
			node: Record< string, unknown >,
			isRoot: boolean
		): Record< string, unknown > => {
			const out: Record< string, unknown > = {};
			for ( const [ key, value ] of Object.entries( node ) ) {
				if ( META.has( key ) || ( isRoot && key === 'title' ) ) {
					continue;
				}
				if ( key === 'properties' && value && typeof value === 'object' ) {
					const props: Record< string, unknown > = {};
					for ( const [ propName, propSchema ] of Object.entries(
						value as Record< string, unknown >
					) ) {
						props[ propName ] = stripMeta( propSchema as Record< string, unknown >, false );
					}
					out[ key ] = props;
				} else if ( value && typeof value === 'object' && ! Array.isArray( value ) ) {
					out[ key ] = stripMeta( value as Record< string, unknown >, false );
				} else {
					out[ key ] = value;
				}
			}
			return out;
		};
		assert.deepEqual( AGENT_OUTPUT_SCHEMA, stripMeta( fileSchema, true ) );
	} );
} );

describe( 'validateAgainstSchema', () => {
	it( 'accepts a valid output', () => {
		assert.deepEqual( validateAgainstSchema( validOutput(), fileSchema ), [] );
	} );

	it( 'rejects fewer than 6 tasks', () => {
		const out = validOutput();
		out.tasks = out.tasks.slice( 0, 5 );
		assert.ok( validateAgainstSchema( out, fileSchema ).length > 0 );
	} );

	it( 'rejects an empty subtitle', () => {
		const out = validOutput();
		out.tasks[ 0 ].subtitle = '';
		assert.ok( validateAgainstSchema( out, fileSchema ).length > 0 );
	} );

	it( 'accepts an inferred theme_keyword', () => {
		const out = validOutput();
		( out.inferred as Record< string, unknown > ).theme_keyword = 'hiking';
		assert.deepEqual( validateAgainstSchema( out, fileSchema ), [] );
	} );

	it( 'rejects an unknown goal enum value', () => {
		const out = validOutput();
		( out.inferred as { goal: string } ).goal = 'cook';
		assert.ok( validateAgainstSchema( out, fileSchema ).length > 0 );
	} );

	it( 'rejects additional properties', () => {
		const out = validOutput() as Record< string, unknown >;
		out.extra = true;
		assert.ok( validateAgainstSchema( out, fileSchema ).length > 0 );
	} );

	it( 'rejects a missing required field', () => {
		const out = validOutput() as Record< string, unknown >;
		delete out.first_post_draft;
		assert.ok( validateAgainstSchema( out, fileSchema ).length > 0 );
	} );
} );

describe( 'parseAgentResponse', () => {
	it( 'returns the typed output for a valid JSON string', () => {
		const parsed = parseAgentResponse( JSON.stringify( validOutput() ) );
		assert.ok( parsed );
		assert.equal( parsed!.tasks.length, 6 );
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
