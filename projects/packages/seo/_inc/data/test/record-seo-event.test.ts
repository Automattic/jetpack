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

const { recordSeoEvent } = await import( '../record-seo-event' );

describe( 'recordSeoEvent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'merges the server context, fixed surface, screen, and event props', () => {
		getScriptData.mockReturnValue( {
			seo: {
				tracks: {
					blog_id: 42,
					site_type: 'atomic',
					is_a11n: false,
					is_test: false,
					product_version: '0.4.0',
				},
			},
		} );

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

	it( 'still fires (surface + screen only) when the tracks context is absent', () => {
		getScriptData.mockReturnValue( undefined );

		recordSeoEvent( 'jetpack_seo_screen_viewed', 'overview' );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_seo_screen_viewed', {
			surface: 'wp_admin',
			screen: 'overview',
		} );
	} );
} );
