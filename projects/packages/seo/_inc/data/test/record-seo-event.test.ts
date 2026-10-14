import { jest } from '@jest/globals';

// `--experimental-vm-modules` (true ESM): register mocks, then dynamically import
// the module under test so it binds to them.
const recordEvent = jest.fn();
const getScriptData = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	default: { tracks: { recordEvent } },
} ) );
jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData,
} ) );

const { recordSeoEvent, recordScreenViewOnce } = await import( '../record-seo-event' );

const CONTEXT = {
	blog_id: 42,
	site_type: 'atomic',
	is_a11n: false,
	is_test: false,
	product_version: '0.4.0',
};

describe( 'recordSeoEvent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'merges the server context, fixed surface, screen, and event props', () => {
		getScriptData.mockReturnValue( { seo: { tracks: CONTEXT } } );

		recordSeoEvent( 'jetpack_seo_llms_txt_enabled', 'geo', { enabled: true } );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_seo_llms_txt_enabled', {
			surface: 'wp_admin',
			screen: 'geo',
			blog_id: 42,
			site_type: 'atomic',
			is_a11n: false,
			is_test: false,
			product_version: '0.4.0',
			enabled: true,
		} );
	} );

	it( 'records nothing when the server sent no context, as on sites without tracking consent', () => {
		getScriptData.mockReturnValue( { seo: {} } );

		expect( recordSeoEvent( 'jetpack_seo_screen_viewed', 'overview' ) ).toBe( false );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );

	it( 'records one screen view per page load, even from separately bundled copies', async () => {
		getScriptData.mockReturnValue( { seo: { tracks: CONTEXT } } );
		jest.resetModules();
		const otherBundle = await import( '../record-seo-event' );

		recordScreenViewOnce( 'overview' );
		otherBundle.recordScreenViewOnce( 'settings' );

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_seo_screen_viewed',
			expect.objectContaining( { screen: 'overview' } )
		);
	} );
} );
