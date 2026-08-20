/**
 * External dependencies
 */
import { getScriptData, isSimpleSite } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getReportDefinition } from './registry';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => true ),
	getScriptData: jest.fn(),
} ) );

const mockIsSimpleSite = isSimpleSite as jest.Mock;
const mockGetScriptData = getScriptData as jest.Mock;

/**
 * Point the mocked script data at a site with or without VideoPress.
 *
 * @param hasVideoPress - Whether the site runs VideoPress.
 */
function setVideoPress( hasVideoPress: boolean ) {
	mockGetScriptData.mockReturnValue( { premium_analytics: { has_videopress: hasVideoPress } } );
}

describe( 'getReportDefinition', () => {
	beforeEach( () => {
		mockIsSimpleSite.mockReturnValue( true );
		setVideoPress( true );
	} );

	it( 'returns undefined for an unknown report', () => {
		expect( getReportDefinition( 'unknown' ) ).toBeUndefined();
		expect( getReportDefinition( undefined ) ).toBeUndefined();
	} );

	// The id comes from the URL, so an inherited object property must not read
	// as a report.
	it.each( [ 'constructor', 'toString', 'hasOwnProperty' ] )(
		'returns undefined for the inherited %s property',
		id => {
			expect( getReportDefinition( id ) ).toBeUndefined();
		}
	);

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

	it( 'returns the videos report on sites running VideoPress', () => {
		expect( getReportDefinition( 'videos' )?.id ).toBe( 'videos' );
	} );

	it( 'hides the videos report without VideoPress', () => {
		setVideoPress( false );

		expect( getReportDefinition( 'videos' ) ).toBeUndefined();
	} );

	it( 'hides the videos report when the site never published the flag', () => {
		mockGetScriptData.mockReturnValue( undefined );

		expect( getReportDefinition( 'videos' ) ).toBeUndefined();
	} );
} );
