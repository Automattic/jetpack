import { WIZARD_EVENTS, lengthBucket } from '../telemetry';

// Copied from Jetpack_Tracks_Event::EVENT_NAME_REGEX, which drops a miss without a word.
const EVENT_NAME = /^(([a-z0-9]+)_){2}([a-z0-9_]+)$/;

describe( 'Wizard event names', () => {
	it.each( Object.entries( WIZARD_EVENTS ) )( '%s is a name Tracks will take', ( _key, name ) => {
		expect( name ).toMatch( EVENT_NAME );
	} );

	it( 'has no two events sharing a name', () => {
		const names = Object.values( WIZARD_EVENTS );

		expect( new Set( names ).size ).toBe( names.length );
	} );
} );

describe( 'The free-text bucket', () => {
	/*
	 * The one property that touches something a person wrote. If this ever
	 * returns the text, the wizard starts sending whatever someone typed about
	 * their own site to Tracks.
	 */
	it( 'never returns anything from the text', () => {
		const typed = 'A wiki for the Smith family, kept at smith-family.example since 2019';

		expect( lengthBucket( typed ) ).toBe( 'long' );
		expect( lengthBucket( typed ) ).not.toContain( 'Smith' );
		expect( lengthBucket( typed ) ).not.toContain( 'example' );
	} );

	it( 'buckets by length and nothing else', () => {
		expect( lengthBucket( '' ) ).toBe( 'empty' );
		expect( lengthBucket( '   ' ) ).toBe( 'empty' );
		expect( lengthBucket( 'A wiki' ) ).toBe( 'short' );
		expect( lengthBucket( 'a'.repeat( 20 ) ) ).toBe( 'short' );
		expect( lengthBucket( 'a'.repeat( 21 ) ) ).toBe( 'medium' );
		expect( lengthBucket( 'a'.repeat( 60 ) ) ).toBe( 'medium' );
		expect( lengthBucket( 'a'.repeat( 61 ) ) ).toBe( 'long' );
	} );

	// Two people who wrote different things of the same length are the same row.
	it( 'says the same thing about different text of the same length', () => {
		expect( lengthBucket( 'my band site' ) ).toBe( lengthBucket( 'jane@mail.com' ) );
	} );
} );
