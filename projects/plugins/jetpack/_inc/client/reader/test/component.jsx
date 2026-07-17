import { render, screen } from 'test/test-utils';
import Reader from '../index';

// Mock components that do fetches in the background
jest.mock( 'components/data/query-site', () => ( {
	__esModule: true,
	default: () => 'query-site',
} ) );

describe( 'Reader', () => {
	const defaultProps = {
		active: true,
		searchTerm: '',
		blogID: 12345,
	};

	const initialState = {
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
					reader: {
						module: 'wpcom-reader',
						activated: true,
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
				items: {},
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
				},
			},
			pluginsData: {
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

	describe( 'When active', () => {
		it( 'renders the section title', () => {
			render( <Reader { ...defaultProps } />, { initialState } );
			expect(
				screen.getByText( 'Discover and follow your favorite sites with the WordPress.com Reader.' )
			).toBeInTheDocument();
		} );

		it( 'renders the screen reader heading', () => {
			render( <Reader { ...defaultProps } />, { initialState } );
			expect( screen.getByText( 'Jetpack Reader Settings' ) ).toBeInTheDocument();
		} );

		it( 'renders the Discover card with promotional copy', () => {
			render( <Reader { ...defaultProps } />, { initialState } );
			expect(
				screen.getByText(
					'Follow sites and discover new content from the WordPress.com and Jetpack network.'
				)
			).toBeInTheDocument();
		} );

		it( 'renders the Discover card bullet points', () => {
			render( <Reader { ...defaultProps } />, { initialState } );
			expect( screen.getByText( 'Follow blogs you like' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Discover posts by topic' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Reach new readers' ) ).toBeInTheDocument();
		} );

		it( 'renders the "Visit the Reader" link with correct href and target', () => {
			render( <Reader { ...defaultProps } />, { initialState } );
			const link = screen.getByRole( 'link', { name: /Visit the Reader/i } );
			expect( link ).toHaveAttribute(
				'href',
				'https://wordpress.com/reader/?origin_site_id=12345'
			);
			expect( link ).toHaveAttribute( 'target', '_blank' );
		} );
	} );

	describe( 'When searching', () => {
		it( 'renders "Reader" as the section title when searchTerm is provided', () => {
			render( <Reader { ...defaultProps } searchTerm="reader" />, { initialState } );
			expect( screen.getByRole( 'heading', { name: 'Reader' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When not active and no search term', () => {
		it( 'returns null', () => {
			const { container } = render( <Reader { ...defaultProps } active={ false } searchTerm="" />, {
				initialState,
			} );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'When module is not found', () => {
		it( 'returns null', () => {
			// Create state without the reader module to simulate module not found
			const stateWithoutReaderModule = {
				...initialState,
				jetpack: {
					...initialState.jetpack,
					modules: {
						...initialState.jetpack.modules,
						items: {},
					},
				},
			};

			const { container } = render( <Reader { ...defaultProps } />, {
				initialState: stateWithoutReaderModule,
			} );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
