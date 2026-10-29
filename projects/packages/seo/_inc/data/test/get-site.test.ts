import { jest } from '@jest/globals';

// True-ESM Jest (`--experimental-vm-modules`): register the mock with
// `jest.unstable_mockModule` and import the module under test dynamically after.
const getScriptData = jest.fn< () => unknown >();

jest.unstable_mockModule( '@automattic/jetpack-script-data', () => ( {
	getScriptData,
} ) );

const { default: getSite } = await import( '../get-site' );

const site = {
	title: 'Example site',
	tagline: 'Example tagline',
	url: 'https://example.com',
	icon: '',
	image: '',
};

describe( 'getSite', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'is null when the bootstrap has no site data', () => {
		getScriptData.mockReturnValue( { seo: {} } );

		expect( getSite() ).toBeNull();
	} );

	// WordPress runs the site title and tagline through esc_html() when saving them.
	it( 'decodes the HTML entities WordPress stores in the site title and tagline', () => {
		getScriptData.mockReturnValue( {
			seo: {
				site: {
					...site,
					title: 'Bob&#039;s &amp; Co',
					tagline: 'Fish &quot;n&quot; chips',
				},
			},
		} );

		expect( getSite() ).toEqual( {
			...site,
			title: "Bob's & Co",
			tagline: 'Fish "n" chips',
		} );
	} );

	it( 'returns the same object on every call for the same bootstrap', () => {
		getScriptData.mockReturnValue( { seo: { site } } );

		expect( getSite() ).toBe( getSite() );
	} );
} );
