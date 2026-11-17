import { jest } from '@jest/globals';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const getScriptData = jest.fn< () => unknown >();

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData,
} ) );

const { default: getOutput } = await import( '../get-output' );

describe( 'getOutput', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns the bootstrapped output state', () => {
		getScriptData.mockReturnValue( {
			seo: { output: { paused: true, conflicting_plugin: 'Yoast SEO' } },
		} );

		expect( getOutput() ).toEqual( { paused: true, conflicting_plugin: 'Yoast SEO' } );
	} );

	// A stale page snapshot must never lock settings that can still be saved.
	it.each( [
		[ 'the output slice', { seo: {} } ],
		[ 'the seo slice', {} ],
		[ 'script data', undefined ],
	] )( 'reports live output when %s is absent', ( _, data ) => {
		getScriptData.mockReturnValue( data );

		expect( getOutput() ).toEqual( { paused: false, conflicting_plugin: '' } );
	} );
} );
