/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getReportDefinition } from './registry';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => true ),
} ) );

const mockIsSimpleSite = isSimpleSite as jest.Mock;

describe( 'getReportDefinition', () => {
	beforeEach( () => {
		mockIsSimpleSite.mockReturnValue( true );
	} );

	it( 'returns undefined for an unknown report', () => {
		expect( getReportDefinition( 'unknown' ) ).toBeUndefined();
		expect( getReportDefinition( undefined ) ).toBeUndefined();
	} );

	it( 'returns the downloads report on Simple sites', () => {
		expect( getReportDefinition( 'downloads' )?.id ).toBe( 'downloads' );
	} );

	it( 'hides the downloads report on non-Simple sites', () => {
		// Calypso only shows file downloads on Simple sites ("not yet supported
		// in Jetpack environment", which includes Atomic); the route guard
		// redirects an unavailable report to the dashboard, same as an unknown
		// one.
		mockIsSimpleSite.mockReturnValue( false );

		expect( getReportDefinition( 'downloads' ) ).toBeUndefined();
	} );

	it( 'keeps other reports available on non-Simple sites', () => {
		mockIsSimpleSite.mockReturnValue( false );

		expect( getReportDefinition( 'posts' )?.id ).toBe( 'posts' );
	} );
} );
