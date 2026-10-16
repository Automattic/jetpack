import { jest } from '@jest/globals';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const getScriptData = jest.fn< () => unknown >();

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData,
} ) );

const { isGated, getUpsellUrl } = await import( '../is-gated' );

describe( 'isGated', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'is true when the bootstrap reports the site as gated', () => {
		getScriptData.mockReturnValue( {
			seo: { gating: { is_gated: true, upsell_url: 'https://example.com/checkout' } },
		} );

		expect( isGated() ).toBe( true );
	} );

	it( 'is false when the bootstrap reports the site as ungated', () => {
		getScriptData.mockReturnValue( {
			seo: { gating: { is_gated: false, upsell_url: '' } },
		} );

		expect( isGated() ).toBe( false );
	} );

	// The safe default: a paying customer must never be reduced to the gated view
	// because the page snapshot was stale or incomplete.
	it( 'defaults to ungated when the gating slice is absent', () => {
		getScriptData.mockReturnValue( { seo: {} } );

		expect( isGated() ).toBe( false );
	} );

	it( 'defaults to ungated when the seo slice is absent', () => {
		getScriptData.mockReturnValue( {} );

		expect( isGated() ).toBe( false );
	} );

	it( 'defaults to ungated when there is no script data at all', () => {
		getScriptData.mockReturnValue( undefined );

		expect( isGated() ).toBe( false );
	} );
} );

describe( 'getUpsellUrl', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'returns the bootstrapped checkout URL', () => {
		getScriptData.mockReturnValue( {
			seo: {
				gating: { is_gated: true, upsell_url: 'https://wordpress.com/checkout/x/value_bundle' },
			},
		} );

		expect( getUpsellUrl() ).toBe( 'https://wordpress.com/checkout/x/value_bundle' );
	} );

	it( 'returns an empty string when the slice is absent', () => {
		getScriptData.mockReturnValue( {} );

		expect( getUpsellUrl() ).toBe( '' );
	} );
} );
