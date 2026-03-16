import { render, screen } from 'test/test-utils';
import Newsletter from '../newsletter';

// Mock components that do fetches in the background
jest.mock( 'components/data/query-site', () => ( {
	__esModule: true,
	default: () => 'query-site',
} ) );

describe( 'Newsletter', () => {
	const defaultProps = {
		siteRawUrl: 'example.org',
		blogID: 123,
		isSavingAnyOption: () => false,
		isLinked: true,
		isSubscriptionsActive: true,
		unavailableInOfflineMode: false,
		subscriptions: {
			name: 'subscriptions',
			description: 'Let visitors subscribe to your posts',
		},
		siteHasConnectedUser: true,
		wpAdminSubscriberManagementEnabled: true,
		siteAdminUrl: 'https://example.org/wp-admin/',
		getOptionValue: () => true,
		newsletterSendDefault: true,
		updateOptions: jest.fn().mockResolvedValue( {} ),
		updateFormStateAndSaveOptionValue: jest.fn(),
		refreshSettings: jest.fn(),
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
					subscriptions: {
						module: 'subscriptions',
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
		},
	};

	describe( 'Initially', () => {
		it( 'renders header and manage subscribers link', () => {
			render( <Newsletter { ...defaultProps } />, { initialState } );
			expect(
				screen.getByText( 'Newsletter' ).closest( '.dops-section-header' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Manage all subscribers' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Email new posts to subscribers by default toggle', () => {
		it( 'renders the toggle', () => {
			render( <Newsletter { ...defaultProps } />, { initialState } );
			expect( screen.getByText( 'Email new posts to subscribers by default' ) ).toBeInTheDocument();
		} );

		it( 'is checked when newsletterSendDefault is true', () => {
			render( <Newsletter { ...defaultProps } />, { initialState } );
			const toggle = screen.getByLabelText( 'Email new posts to subscribers by default' );
			expect( toggle ).toBeChecked();
		} );

		it( 'is unchecked when newsletterSendDefault is false', () => {
			const propsWithSendDefaultFalse = {
				...defaultProps,
				getOptionValue: option => ( option === 'wpcom_newsletter_send_default' ? false : true ),
			};
			render( <Newsletter { ...propsWithSendDefaultFalse } />, { initialState } );
			const toggle = screen.getByLabelText( 'Email new posts to subscribers by default' );
			expect( toggle ).not.toBeChecked();
		} );

		it( 'is disabled and unchecked when subscriptions are inactive', () => {
			const propsWithSubscriptionsInactive = {
				...defaultProps,
				getOptionValue: option => ( option === 'subscriptions' ? false : true ),
			};
			render( <Newsletter { ...propsWithSubscriptionsInactive } />, { initialState } );
			const toggle = screen.getByLabelText( 'Email new posts to subscribers by default' );
			expect( toggle ).not.toBeChecked();
			expect( toggle ).toBeDisabled();
		} );
	} );
} );
