import { jest } from '@jest/globals';
import type { OverviewResponse } from '../overview-types';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const getOverview = jest.fn< () => OverviewResponse | null >();

jest.unstable_mockModule( '../get-overview', () => ( {
	default: getOverview,
} ) );

const { default: isSeoToolsActive } = await import( '../is-seo-tools-active' );

// Minimal Overview slice with a controllable `seo_tools_active` flag; the helper
// only reads that field, so the rest can be a loose cast.
const overviewWith = ( seoToolsActive: boolean ) =>
	( { site_visibility: { seo_tools_active: seoToolsActive } } ) as OverviewResponse;

describe( 'isSeoToolsActive', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'is true when the module is active in the bootstrap', () => {
		getOverview.mockReturnValue( overviewWith( true ) );
		expect( isSeoToolsActive() ).toBe( true );
	} );

	it( 'is false when the module is inactive in the bootstrap', () => {
		getOverview.mockReturnValue( overviewWith( false ) );
		expect( isSeoToolsActive() ).toBe( false );
	} );

	it( 'is false when the bootstrap is missing', () => {
		getOverview.mockReturnValue( null );
		expect( isSeoToolsActive() ).toBe( false );
	} );
} );
