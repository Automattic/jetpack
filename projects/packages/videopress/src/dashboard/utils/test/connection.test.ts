import { getScriptData } from '@automattic/jetpack-script-data';
import { isWpcomConnected } from '../connection';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

const mockGetScriptData = getScriptData as jest.MockedFunction< typeof getScriptData >;

/**
 * Stand in for the boot payload's script data.
 *
 * @param data - The payload to return, or undefined for none at all.
 */
function withScriptData( data: unknown ) {
	mockGetScriptData.mockReturnValue( data as ReturnType< typeof getScriptData > );
}

describe( 'isWpcomConnected', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	// The upload surfaces branch on this one boolean: connected sites get the
	// tus/VideoPress uploader, disconnected ones the plain wp/v2/media fallback.
	// Every route that reads it mocks it, so the real thing is only exercised
	// here.
	it( 'is true for a positive blog id', () => {
		withScriptData( { site: { wpcom: { blog_id: 123 } } } );

		expect( isWpcomConnected() ).toBe( true );
	} );

	it.each( [
		[ 'no script data at all', undefined ],
		[ 'a payload with no site', {} ],
		[ 'a site with no wpcom section', { site: {} } ],
		[ 'a wpcom section with no blog id', { site: { wpcom: {} } } ],
		// A disconnected install reports 0, not a missing field — treating that
		// as connected would send the upload down the tus path with no JWT.
		[ 'a zero blog id', { site: { wpcom: { blog_id: 0 } } } ],
		// Simple sites have historically carried this as a string.
		[ 'a string blog id', { site: { wpcom: { blog_id: '123' } } } ],
	] )( 'is false for %s', ( _label, data ) => {
		withScriptData( data );

		expect( isWpcomConnected() ).toBe( false );
	} );
} );
