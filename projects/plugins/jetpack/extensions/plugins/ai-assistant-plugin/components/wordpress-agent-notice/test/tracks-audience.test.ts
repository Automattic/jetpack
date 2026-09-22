/**
 * Internal dependencies
 */
import { getTracksAudienceProperties } from '../tracks-audience';

// Production injects a bare `const agentsManagerData` global. Tests cannot
// declare a lexical const, so they assign the global-object property, which
// the same bare-identifier read resolves to in jsdom.
const setInlineData = ( data: object | undefined ) => {
	if ( data === undefined ) {
		delete ( globalThis as Record< string, unknown > ).agentsManagerData;
		return;
	}
	( globalThis as Record< string, unknown > ).agentsManagerData = data;
};

const setBigSkyState = ( state: object | undefined ) => {
	if ( state === undefined ) {
		delete ( globalThis as Record< string, unknown > ).bigSkyInitialState;
		return;
	}
	( globalThis as Record< string, unknown > ).bigSkyInitialState = state;
};

describe( 'getTracksAudienceProperties', () => {
	afterEach( () => {
		setInlineData( undefined );
		setBigSkyState( undefined );
	} );

	it( 'reports an ordinary environment when no payload exists at all', () => {
		expect( getTracksAudienceProperties() ).toEqual( { is_test: false } );
	} );

	it( 'omits is_a11n rather than guessing when the payload lacks it', () => {
		setInlineData( { isDevMode: false } );

		expect( getTracksAudienceProperties() ).not.toHaveProperty( 'is_a11n' );
	} );

	it( 'passes a true is_a11n through', () => {
		setInlineData( { isA11n: true } );

		expect( getTracksAudienceProperties() ).toMatchObject( { is_a11n: true } );
	} );

	it( 'passes a false is_a11n through, which differs from omitting it', () => {
		setInlineData( { isA11n: false } );

		expect( getTracksAudienceProperties() ).toMatchObject( { is_a11n: false } );
	} );

	it( 'drops a malformed is_a11n instead of recording it', () => {
		setInlineData( { isA11n: 'true' } );

		expect( getTracksAudienceProperties() ).not.toHaveProperty( 'is_a11n' );
	} );

	it( 'marks Agents Manager dev mode as test traffic', () => {
		setInlineData( { isDevMode: true } );

		expect( getTracksAudienceProperties() ).toMatchObject( { is_test: true } );
	} );

	it( 'marks Big Sky dev mode as test traffic too, as the family recorder does', () => {
		setBigSkyState( { isDevMode: true } );

		expect( getTracksAudienceProperties() ).toMatchObject( { is_test: true } );
	} );

	it( 'keeps a plain environment out of the test bucket when signals say false', () => {
		setInlineData( { isDevMode: false } );
		setBigSkyState( { isDevMode: false } );

		expect( getTracksAudienceProperties() ).toMatchObject( { is_test: false } );
	} );
} );
