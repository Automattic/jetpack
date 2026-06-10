import restApi from '@automattic/jetpack-api';
import userEvent from '@testing-library/user-event';
import { render, screen } from 'test/test-utils';
import { Blaze } from '../../blaze';

jest.mock( '@automattic/jetpack-api', () => ( {
	fetchBlazeActiveCampaigns: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn().mockReturnValue( {
		site: {
			suffix: 'example.com',
		},
	} ),
	isWoASite: jest.fn().mockReturnValue( false ),
} ) );

jest.mock( 'lib/analytics', () => ( {
	tracks: {
		recordEvent: jest.fn(),
		recordJetpackClick: jest.fn(),
	},
} ) );

describe( 'Blaze settings', () => {
	const defaultProps = {
		blazeActive: true,
		blazeAvailable: {
			can_init: true,
			reason: null,
		},
		blazeDashboardEnabled: true,
		blazeModule: {
			description: 'Blaze module description.',
		},
		hasConnectedOwner: true,
		isOfflineMode: false,
		isSavingAnyOption: jest.fn().mockReturnValue( false ),
		isUnavailableInOfflineMode: jest.fn().mockReturnValue( false ),
		siteAdminUrl: 'https://example.com/wp-admin/',
		toggleModuleNow: jest.fn(),
	};

	const initialState = {
		jetpack: {
			initialState: {
				adminUrl: 'https://example.com/wp-admin/',
				isBlazeDashboardEnabled: true,
				shouldInitializeBlaze: {
					can_init: true,
					reason: null,
				},
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
			},
			connection: {
				status: {
					siteConnected: {
						hasConnectedOwner: true,
						offlineMode: {
							isActive: false,
						},
						status: 'connected',
					},
				},
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			modules: {
				items: {
					blaze: {},
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
				data: {
					site: {
						features: {
							active: [],
						},
					},
				},
				requests: {},
			},
		},
	};

	const renderCard = ( props = {} ) => {
		const mergedProps = {
			...defaultProps,
			...props,
		};

		render( <Blaze { ...mergedProps } />, {
			initialState,
		} );

		return {
			toggle: screen.getByRole( 'checkbox', {
				name: /Attract high-quality traffic to your site using Blaze./,
			} ),
			props: mergedProps,
		};
	};

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'disables without warning when no active campaigns exist', async () => {
		restApi.fetchBlazeActiveCampaigns.mockResolvedValue( {
			has_active_campaigns: false,
			status: 'none',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( restApi.fetchBlazeActiveCampaigns ).toHaveBeenCalledTimes( 1 );
		expect( props.toggleModuleNow ).toHaveBeenCalledWith( 'blaze' );
		expect(
			screen.queryByRole( 'dialog', { name: /Active Blaze campaigns/ } )
		).not.toBeInTheDocument();
	} );

	it( 'warns before disabling when active campaigns exist', async () => {
		restApi.fetchBlazeActiveCampaigns.mockResolvedValue( {
			has_active_campaigns: true,
			status: 'active',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( restApi.fetchBlazeActiveCampaigns ).toHaveBeenCalledTimes( 1 );
		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		await expect(
			screen.findByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).toHaveClass( 'jp-blaze-disable-warning-modal' );
		expect( screen.getByRole( 'button', { name: /^Close$/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Manage campaigns/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/tools.php?page=advertising'
		);
	} );

	it( 'disables after explicit confirmation from the warning', async () => {
		restApi.fetchBlazeActiveCampaigns.mockResolvedValue( {
			has_active_campaigns: true,
			status: 'active',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );
		await user.click(
			await screen.findByRole( 'button', {
				name: /Disable anyway/,
			} )
		);

		expect( props.toggleModuleNow ).toHaveBeenCalledWith( 'blaze' );
	} );

	it( 'keeps Blaze enabled from the warning', async () => {
		restApi.fetchBlazeActiveCampaigns.mockResolvedValue( {
			has_active_campaigns: true,
			status: 'active',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );
		await user.click(
			await screen.findByRole( 'button', {
				name: /Keep Blaze enabled/,
			} )
		);

		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		expect(
			screen.queryByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).not.toBeInTheDocument();
	} );

	it( 'warns conservatively when the active campaign lookup fails', async () => {
		restApi.fetchBlazeActiveCampaigns.mockRejectedValue( new Error( 'network unavailable' ) );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( restApi.fetchBlazeActiveCampaigns ).toHaveBeenCalledTimes( 1 );
		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		await expect(
			screen.findByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).resolves.toBeInTheDocument();
	} );

	it( 'activates without checking for active campaigns', async () => {
		const user = userEvent.setup();
		const { toggle, props } = renderCard( { blazeActive: false } );

		await user.click( toggle );

		expect( restApi.fetchBlazeActiveCampaigns ).not.toHaveBeenCalled();
		expect( props.toggleModuleNow ).toHaveBeenCalledWith( 'blaze' );
	} );
} );
