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

/**
 * Point the mocked script data at a preview exposing only the given tabs.
 *
 * @param sections - URL-facing slugs of the tabs the preview exposes.
 */
function setPreviewSections( sections: string[] ) {
	mockGetScriptData.mockReturnValue( {
		premium_analytics: { has_videopress: true, preview_sections: sections },
	} );
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
		// Calypso shows file downloads only on Simple sites; an unavailable report
		// gets the same route-guard redirect as an unknown one.
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

	it( 'hides a report whose tab the preview does not expose', () => {
		setPreviewSections( [ 'traffic' ] );

		expect( getReportDefinition( 'comments' ) ).toBeUndefined();
		expect( getReportDefinition( 'emails' ) ).toBeUndefined();
	} );

	it( 'keeps the Traffic reports while the preview is scoped', () => {
		setPreviewSections( [ 'traffic' ] );

		expect( getReportDefinition( 'posts' )?.id ).toBe( 'posts' );
		expect( getReportDefinition( 'videos' )?.id ).toBe( 'videos' );
	} );

	it( 'opens a report once its tab joins the scope', () => {
		setPreviewSections( [ 'traffic', 'insights' ] );

		expect( getReportDefinition( 'comments' )?.id ).toBe( 'comments' );
		expect( getReportDefinition( 'emails' ) ).toBeUndefined();
	} );

	// An absent list means the dashboard was never scoped, not that nothing is in scope.
	it( 'leaves every report available when no scope was published', () => {
		expect( getReportDefinition( 'comments' )?.id ).toBe( 'comments' );
		expect( getReportDefinition( 'emails' )?.id ).toBe( 'emails' );
	} );
} );
