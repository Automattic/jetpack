import { render, screen } from 'test/test-utils';
import Traffic from '../index';

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
 * Build initial Redux state for Traffic component tests.
 *
 * @param {object} overrides - State overrides (e.g. moduleItems, searchTerm).
 * @return {object} The initial Redux state.
 */
function buildInitialState( overrides = {} ) {
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
				items: overrides.moduleItems ?? {
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
				searchTerm: overrides.searchTerm ?? '',
			},
		},
	};
}

describe( 'Traffic settings', () => {
	const defaultProps = {
		active: true,
		searchTerm: '',
		siteRawUrl: 'example.org',
		siteAdminUrl: 'https://example.org/wp-admin/',
		blogID: 12345,
	};

	it( 'renders the SEO card when seo-tools module exists', () => {
		render( <Traffic { ...defaultProps } />, {
			initialState: buildInitialState(),
		} );

		expect( screen.getByText( 'Search engine optimization' ) ).toBeInTheDocument();
	} );

	it( 'renders the SEO card when only canonical-urls module exists', () => {
		render( <Traffic { ...defaultProps } />, {
			initialState: buildInitialState( {
				moduleItems: {
					'canonical-urls': {
						module: 'canonical-urls',
						name: 'Canonical URLs',
						description: 'Add canonical URLs to archive pages.',
						activated: false,
					},
				},
			} ),
		} );

		expect( screen.getByText( 'Search engine optimization' ) ).toBeInTheDocument();
	} );

	it( 'does not render the SEO card when neither seo-tools nor canonical-urls exist', () => {
		render( <Traffic { ...defaultProps } />, {
			initialState: buildInitialState( {
				moduleItems: {},
			} ),
		} );

		expect( screen.queryByText( 'Search engine optimization' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the SEO card when searching for "canonical"', () => {
		render( <Traffic { ...defaultProps } searchTerm="canonical" />, {
			initialState: buildInitialState( {
				searchTerm: 'canonical',
			} ),
		} );

		expect( screen.getByText( 'Search engine optimization' ) ).toBeInTheDocument();
	} );
} );
