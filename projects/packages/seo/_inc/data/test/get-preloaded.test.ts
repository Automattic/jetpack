import { jest } from '@jest/globals';

// True-ESM Jest (`--experimental-vm-modules`): mock the script-data edge, then
// import the module under test dynamically.
const mockGetScriptData = jest.fn< () => unknown >();

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData: mockGetScriptData,
} ) );

const { getPreloaded, writePreloaded, OVERVIEW_PATH } = await import( '../get-preloaded' );

describe( 'get-preloaded', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reads a preloaded response body for a path', () => {
		mockGetScriptData.mockReturnValue( {
			seo: { preload: { [ OVERVIEW_PATH ]: { body: { hello: 'world' } } } },
		} );
		expect( getPreloaded( OVERVIEW_PATH ) ).toEqual( { hello: 'world' } );
	} );

	it( 'returns undefined when the path was not preloaded', () => {
		mockGetScriptData.mockReturnValue( { seo: { preload: {} } } );
		expect( getPreloaded( OVERVIEW_PATH ) ).toBeUndefined();
	} );

	it( 'returns undefined when there is no preload map or no script data', () => {
		mockGetScriptData.mockReturnValue( {} );
		expect( getPreloaded( OVERVIEW_PATH ) ).toBeUndefined();

		mockGetScriptData.mockReturnValue( undefined );
		expect( getPreloaded( OVERVIEW_PATH ) ).toBeUndefined();
	} );

	it( 'writePreloaded caches a fetched body so getPreloaded reads it back', () => {
		const scriptData: Record< string, unknown > = {};
		mockGetScriptData.mockReturnValue( scriptData );

		writePreloaded( OVERVIEW_PATH, { fresh: true } );

		expect( getPreloaded( OVERVIEW_PATH ) ).toEqual( { fresh: true } );
	} );

	it( 'writePreloaded is a no-op (no throw) when there is no script data', () => {
		mockGetScriptData.mockReturnValue( undefined );
		expect( () => writePreloaded( OVERVIEW_PATH, { x: 1 } ) ).not.toThrow();
	} );
} );
