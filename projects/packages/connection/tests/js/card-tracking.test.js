const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { describe, it } = require( 'node:test' );

const read = file => fs.readFileSync( path.join( __dirname, file ), 'utf8' );

const card = read( '../../src/connectors/js/connectors-card.js' );
const helper = read( '../../../../js-packages/connection/helpers/connection-tracking.ts' );
const docs = read( '../../docs/connectors.md' );

// The card reads events with optional chaining for older bundles, so a typo'd key sends nothing and throws nothing.
describe( 'Connectors card tracking', () => {
	it( 'only reads event keys that CONNECTION_EVENTS defines', () => {
		const used = new Set(
			[ ...card.matchAll( /CONNECTION_EVENTS\?\.(\w+)/g ) ].map( m => m[ 1 ] )
		);
		const defined = new Set( [ ...helper.matchAll( /^\t(\w+): 'jetpack_/gm ) ].map( m => m[ 1 ] ) );

		assert.ok( used.size > 0 );
		for ( const key of used ) {
			assert.ok( defined.has( key ), `CONNECTION_EVENTS has no ${ key }` );
		}
	} );

	it( 'documents every card_action_click action it sends', () => {
		const row = docs
			.split( '\n' )
			.find( line => line.includes( '`jetpack_connection_card_action_click`' ) );
		const actions = [ ...card.matchAll( /action: (?:\w+ \? )?'(\w+)'(?: : '(\w+)')?/g ) ]
			.flatMap( m => [ m[ 1 ], m[ 2 ] ] )
			.filter( Boolean );

		assert.ok( row );
		assert.ok( actions.length > 0 );
		for ( const action of actions ) {
			assert.ok(
				row.includes( `\`${ action }\`` ),
				`docs/connectors.md does not list ${ action }`
			);
		}
	} );
} );
