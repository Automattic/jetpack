import { render, screen } from 'test/test-utils';
import SEO from '../../seo';
import { stringToTokenizedArray, tokenizedArrayToString } from '../custom-seo-titles';

/* eslint-disable jsx-a11y/label-has-associated-control */
// Mock @automattic/jetpack-components to avoid boost-score-api window.wp.i18n issue
jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( key => `https://jetpack.com/redirect/?source=${ key }` ),
	ToggleControl: ( { label, checked, onChange, disabled } ) => (
		<label>
			<input type="checkbox" checked={ checked } onChange={ onChange } disabled={ disabled } />
			{ label }
		</label>
	),
} ) );
/* eslint-enable jsx-a11y/label-has-associated-control */

// Mock @automattic/social-previews to avoid complex dependency chain
jest.mock( '@automattic/social-previews', () => ( {
	FacebookLinkPreview: () => null,
	TwitterLinkPreview: () => null,
	GoogleSearchPreview: () => null,
} ) );

// Mock components that do fetches in the background
jest.mock( 'components/data/query-site', () => ( {
	__esModule: true,
	default: () => 'query-site',
} ) );

/**
 * Build initial Redux state for the SEO component tests.
 *
 * @param {object} overrides - State overrides (e.g. settingsItems).
 * @return {object} The initial Redux state.
 */
function buildSeoInitialState( overrides = {} ) {
	return {
		jetpack: {
			initialState: {
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
				WP_API_nonce: 'nonce',
				WP_API_root: '/wp-admin/',
				siteData: {
					blog_id: 1,
				},
				getModules: {
					'seo-tools': {
						options: {},
					},
				},
			},
			connection: {
				status: {
					siteConnected: {
						offlineMode: {
							isActive: false,
						},
						isActive: true,
					},
				},
				user: {
					currentUser: {
						isConnected: true,
					},
				},
				requests: {
					disconnectingSite: false,
				},
			},
			modules: {
				items: {
					'seo-tools': {
						module: 'seo-tools',
						name: 'SEO Tools',
						description: 'Better results on search engines and social media.',
						activated: true,
					},
					'canonical-urls': {
						module: 'canonical-urls',
						name: 'Canonical URLs',
						description: 'Add canonical URLs to archive pages.',
						activated: false,
					},
				},
				requests: {
					fetchingModulesList: false,
					activating: {},
					deactivating: {},
					updatingOption: {},
				},
			},
			settings: {
				items: {
					'seo-tools': true,
					'canonical-urls': false,
					advanced_seo_front_page_description: '',
					advanced_seo_title_formats: {},
					ai_seo_enhancer_enabled: false,
					...( overrides.settingsItems || {} ),
				},
				requests: {
					fetchingSettingsList: false,
					settingsSent: {},
					updatedSettings: {},
				},
			},
			dashboard: {
				requests: {
					fetchingVaultPressData: false,
					checkingAkismetKey: false,
				},
			},
			siteData: {
				requests: {
					isFetchingSiteData: false,
					isFetchingSiteFeatures: false,
					isFetchingSitePlans: false,
					isFetchingSitePurchases: false,
					isFetchingSiteDiscount: false,
				},
				data: {
					site: {
						features: {
							active: [ 'advanced-seo' ],
						},
					},
				},
			},
			pluginsData: {
				items: {},
				requests: {
					isFetchingPluginsData: false,
				},
			},
			recommendations: {
				requests: {
					isRecommendationsDataLoaded: false,
				},
			},
			search: {
				searchTerm: '',
			},
		},
	};
}

describe( 'SEO - Canonical URLs Toggle', () => {
	const defaultProps = {
		siteRawUrl: 'example.org',
		siteAdminUrl: 'https://example.org/wp-admin/',
		getModule: jest.fn( () => ( {
			module: 'seo-tools',
			name: 'SEO Tools',
			description: 'Better results on search engines and social media.',
		} ) ),
		getModuleOverride: jest.fn( () => false ),
		isSiteConnected: true,
		isOfflineMode: false,
		isUnavailableInOfflineMode: jest.fn( () => false ),
		hasConnectedOwner: true,
	};

	it( 'renders the canonical URLs toggle', () => {
		render( <SEO { ...defaultProps } />, {
			initialState: buildSeoInitialState(),
		} );

		expect( screen.getByText( 'Add canonical URLs to archive pages' ) ).toBeInTheDocument();
	} );

	it( 'renders the canonical URLs explanation text', () => {
		render( <SEO { ...defaultProps } />, {
			initialState: buildSeoInitialState(),
		} );

		expect(
			screen.getByText(
				'Adds a rel="canonical" link to archive pages, helping search engines identify the preferred URL and avoid indexing duplicate content.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows the canonical URLs toggle as checked when activated', () => {
		render( <SEO { ...defaultProps } />, {
			initialState: buildSeoInitialState( {
				settingsItems: { 'canonical-urls': true },
			} ),
		} );

		const toggle = screen.getByLabelText( /Add canonical URLs to archive pages/i );
		expect( toggle ).toBeChecked();
	} );

	it( 'shows the canonical URLs toggle as unchecked when deactivated', () => {
		render( <SEO { ...defaultProps } />, {
			initialState: buildSeoInitialState( {
				settingsItems: { 'canonical-urls': false },
			} ),
		} );

		const toggle = screen.getByLabelText( /Add canonical URLs to archive pages/i );
		expect( toggle ).not.toBeChecked();
	} );
} );

describe( 'Traffic - Custom SEO Titles', () => {
	const allTokens =
		'[site_name][tagline][post_title][page_title][group_title][date][archive_title]';
	const mockData = {
		front_page: {
			str: `front_page ${ allTokens }`,
			arr: [
				{
					type: 'string',
					value: 'front_page ',
				},
				{
					type: 'token',
					value: 'site_name',
				},
				{
					type: 'token',
					value: 'tagline',
				},
				{
					type: 'string',
					value: '[post_title]',
				},
				{
					type: 'string',
					value: '[page_title]',
				},
				{
					type: 'string',
					value: '[group_title]',
				},
				{
					type: 'string',
					value: '[date]',
				},
				{
					type: 'string',
					value: '[archive_title]',
				},
			],
		},
		posts: {
			str: `posts ${ allTokens }`,
			arr: [
				{
					type: 'string',
					value: 'posts ',
				},
				{
					type: 'token',
					value: 'site_name',
				},
				{
					type: 'token',
					value: 'tagline',
				},
				{
					type: 'token',
					value: 'post_title',
				},
				{
					type: 'string',
					value: '[page_title]',
				},
				{
					type: 'string',
					value: '[group_title]',
				},
				{
					type: 'string',
					value: '[date]',
				},
				{
					type: 'string',
					value: '[archive_title]',
				},
			],
		},
		pages: {
			str: `pages ${ allTokens }`,
			arr: [
				{
					type: 'string',
					value: 'pages ',
				},
				{
					type: 'token',
					value: 'site_name',
				},
				{
					type: 'token',
					value: 'tagline',
				},
				{
					type: 'string',
					value: '[post_title]',
				},
				{
					type: 'token',
					value: 'page_title',
				},
				{
					type: 'string',
					value: '[group_title]',
				},
				{
					type: 'string',
					value: '[date]',
				},
				{
					type: 'string',
					value: '[archive_title]',
				},
			],
		},
		groups: {
			str: `groups ${ allTokens }`,
			arr: [
				{
					type: 'string',
					value: 'groups ',
				},
				{
					type: 'token',
					value: 'site_name',
				},
				{
					type: 'token',
					value: 'tagline',
				},
				{
					type: 'string',
					value: '[post_title]',
				},
				{
					type: 'string',
					value: '[page_title]',
				},
				{
					type: 'token',
					value: 'group_title',
				},
				{
					type: 'string',
					value: '[date]',
				},
				{
					type: 'string',
					value: '[archive_title]',
				},
			],
		},
		archives: {
			str: `archives ${ allTokens }`,
			arr: [
				{
					type: 'string',
					value: 'archives ',
				},
				{
					type: 'token',
					value: 'site_name',
				},
				{
					type: 'token',
					value: 'tagline',
				},
				{
					type: 'string',
					value: '[post_title]',
				},
				{
					type: 'string',
					value: '[page_title]',
				},
				{
					type: 'string',
					value: '[group_title]',
				},
				{
					type: 'token',
					value: 'date',
				},
				{
					type: 'token',
					value: 'archive_title',
				},
			],
		},
	};

	describe( 'stringToTokenizedArray()', () => {
		it( 'given an empty string return an empty array', () => {
			const ret = stringToTokenizedArray( '', '' );
			expect( ret ).toBeInstanceOf( Array );
			expect( ret ).toHaveLength( 0 );
		} );

		it( 'tokenize correct tokens per page type', () => {
			expect( stringToTokenizedArray( mockData.front_page.str, 'front_page' ) ).toEqual(
				mockData.front_page.arr
			);
			expect( stringToTokenizedArray( mockData.posts.str, 'posts' ) ).toEqual( mockData.posts.arr );
			expect( stringToTokenizedArray( mockData.pages.str, 'pages' ) ).toEqual( mockData.pages.arr );
			expect( stringToTokenizedArray( mockData.groups.str, 'groups' ) ).toEqual(
				mockData.groups.arr
			);
			expect( stringToTokenizedArray( mockData.archives.str, 'archives' ) ).toEqual(
				mockData.archives.arr
			);
			expect( stringToTokenizedArray( 'Test failure case', 'archives' ) ).not.toEqual(
				mockData.archives.arr
			);
		} );
	} );

	describe( 'tokenizedArrayToString()', () => {
		it( 'given an empty array return an empty string', () => {
			expect( tokenizedArrayToString( [] ) ).toBe( '' );
		} );

		it( 'assemble correct string for given token array', () => {
			expect( tokenizedArrayToString( mockData.front_page.arr ) ).toEqual(
				mockData.front_page.str
			);
			expect( tokenizedArrayToString( mockData.posts.arr ) ).toEqual( mockData.posts.str );
			expect( tokenizedArrayToString( mockData.pages.arr ) ).toEqual( mockData.pages.str );
			expect( tokenizedArrayToString( mockData.groups.arr ) ).toEqual( mockData.groups.str );
			expect( tokenizedArrayToString( mockData.archives.arr ) ).toEqual( mockData.archives.str );
			expect( tokenizedArrayToString( 'Test failure case' ) ).not.toEqual( mockData.archives.str );
		} );
	} );
} );
