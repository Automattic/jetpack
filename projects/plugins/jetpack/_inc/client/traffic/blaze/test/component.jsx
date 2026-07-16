import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import analytics from 'lib/analytics';
import { render, screen } from 'test/test-utils';
import { Blaze } from '../../blaze';

jest.mock( '@wordpress/api-fetch' );

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
		apiFetch.mockResolvedValue( {
			has_active_campaigns: false,
			status: 'none',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/blaze/active-campaigns',
		} );
		expect( props.toggleModuleNow ).toHaveBeenCalledWith( 'blaze' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'blaze',
			toggled: 'off',
		} );
		expect(
			screen.queryByRole( 'dialog', { name: /Active Blaze campaigns/ } )
		).not.toBeInTheDocument();
	} );

	it( 'warns before disabling when active campaigns exist', async () => {
		apiFetch.mockResolvedValue( {
			has_active_campaigns: true,
			status: 'active',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/blaze/active-campaigns',
		} );
		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
		await expect(
			screen.findByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).toHaveClass( 'jp-blaze-disable-warning-modal' );
		expect( screen.getByRole( 'button', { name: /^Close$/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Manage campaigns/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=advertising'
		);
	} );

	it( 'disables after explicit confirmation from the warning', async () => {
		apiFetch.mockResolvedValue( {
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
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'blaze',
			toggled: 'off',
		} );
	} );

	it( 'keeps Blaze enabled from the warning', async () => {
		apiFetch.mockResolvedValue( {
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
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
		expect(
			screen.queryByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps Blaze enabled after opening campaign management from the warning', async () => {
		apiFetch.mockResolvedValue( {
			has_active_campaigns: true,
			status: 'active',
		} );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		const manageCampaignsLink = await screen.findByRole( 'link', { name: /Manage campaigns/ } );
		manageCampaignsLink.addEventListener( 'click', event => event.preventDefault() );
		await user.click( manageCampaignsLink );

		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
		expect(
			screen.queryByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).not.toBeInTheDocument();
	} );

	it( 'warns conservatively when the active campaign lookup fails', async () => {
		apiFetch.mockRejectedValue( new Error( 'network unavailable' ) );

		const user = userEvent.setup();
		const { toggle, props } = renderCard();

		await user.click( toggle );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/blaze/active-campaigns',
		} );
		expect( props.toggleModuleNow ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
		await expect(
			screen.findByRole( 'dialog', { name: /Active Blaze campaigns are still running/ } )
		).resolves.toBeInTheDocument();
	} );

	it( 'activates without checking for active campaigns', async () => {
		const user = userEvent.setup();
		const { toggle, props } = renderCard( { blazeActive: false } );

		await user.click( toggle );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( props.toggleModuleNow ).toHaveBeenCalledWith( 'blaze' );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'blaze',
			toggled: 'on',
		} );
	} );
} );
