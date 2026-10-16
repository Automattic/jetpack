import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { leavePageFor } from '../../../../utils/reload-page';
import { FeatureAction } from '../feature-action';
import { FeatureDelivery } from '../feature-delivery';
import { FeatureItem } from '../feature-item';
import { FeatureModalActions } from '../feature-modal-actions';
import { resolveFeatureState } from '../feature-state';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';

const mockRun = jest.fn< Promise< boolean >, [ unknown ] >( () => Promise.resolve( true ) );
const mockSetModuleActive = jest.fn();

jest.mock( '../../../../utils/reload-page', () => ( { leavePageFor: jest.fn() } ) );

jest.mock( '@automattic/jetpack-connection', () => ( {
	...jest.requireActual( '@automattic/jetpack-connection' ),
	getUserConnectionUrl: jest.fn( () => '/wp-admin/admin.php?connect_url_redirect=1' ),
} ) );

// What a click has asked of the module, when a test wants it to differ from the store.
let mockAskedFor: boolean | null = null;
let mockBusy = false;
let mockInstallError: string | null = null;

jest.mock( '../use-main-features', () => ( {
	useFeaturePlugin: ( plugin: string, name: string ) => ( {
		run: ( action: string, options?: { leavesPage?: boolean } ) =>
			mockRun( { plugin, name, action, ...( options?.leavesPage && { leavesPage: true } ) } ),
		isBusy: mockBusy,
	} ),
	useInstallError: ( plugin: string ) => ( plugin ? mockInstallError : null ),
} ) );

jest.mock( '../../../module-toggle', () => ( {
	// ds-allow: input -- stands in for the real ModuleToggle, which reaches the modules store.
	ModuleToggle: () => <input type="checkbox" aria-label="Module toggle" readOnly />,
	// Mirrors the hook: `isActive` is the value the switch shows, asked-for or stored.
	useModuleActivation: ( $module: { activated: boolean } ) => ( {
		setModuleActive: mockSetModuleActive,
		isUpdating: false,
		isActive: mockAskedFor ?? $module.activated,
	} ),
} ) );

const buildFeature = ( overrides: Partial< MainFeature > = {} ) =>
	( {
		slug: 'boost',
		name: 'Boost',
		manage_url: '',
		plugin: 'jetpack-boost',
		plugin_name: 'Jetpack Boost',
		...overrides,
	} ) as MainFeature;

const buildState = ( control: FeatureState[ 'control' ], overrides = {} ): FeatureState =>
	( { feature: buildFeature(), status: 'inactive', control, ...overrides } ) as FeatureState;

const $module = { module: 'stats', available: true, activated: true } as MyJetpackModule;
const forcedModule = {
	module: 'activity-log',
	available: true,
	activated: true,
	override: 'active',
} as MyJetpackModule;

const setAccountConnect = ( accountConnect: boolean ) => {
	window.myJetpackInitialState.myJetpackFlags = {
		accountConnect,
	} as typeof window.myJetpackInitialState.myJetpackFlags;
};

beforeEach( () => {
	setAccountConnect( false );
	mockRun.mockClear();
	mockSetModuleActive.mockClear();
	( leavePageFor as jest.Mock ).mockClear();
	( getUserConnectionUrl as jest.Mock ).mockClear();
	mockAskedFor = null;
	mockBusy = false;
	mockInstallError = null;
} );

const countControls = () =>
	screen.queryAllByRole( 'checkbox' ).length + screen.queryAllByRole( 'button' ).length;

it.each( [
	[ 'details window', FeatureModalActions ],
	[ 'card', FeatureAction ],
] as const )( 'only opens registered admin pages offline from the %s', ( _, Component ) => {
	const previousInitial = window.myJetpackInitialState;
	const previousData = window.JetpackScriptData;
	const registeredPages: string[] = [];
	window.myJetpackInitialState = { isOfflineFeatures: true } as typeof previousInitial;
	window.JetpackScriptData = {
		myJetpack: { offlineFeatures: { mainFeatures: { available_admin_pages: registeredPages } } },
	} as unknown as typeof previousData;
	try {
		const state = buildState(
			{ kind: 'install-plugin', plugin: 'jetpack-backup', runsWithoutPlugin: true },
			{
				status: 'active',
				feature: buildFeature( { manage_url: '/wp-admin/admin.php?page=stats' } ),
			}
		);
		const { rerender } = render( <Component state={ state } /> );
		expect( screen.queryByRole( 'link', { name: 'Open' } ) ).not.toBeInTheDocument();
		registeredPages.push( 'stats' );
		rerender( <Component state={ state } /> );
		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toHaveAttribute(
			'href',
			state.feature.manage_url
		);
	} finally {
		window.myJetpackInitialState = previousInitial;
		window.JetpackScriptData = previousData;
	}
} );

describe( 'FeatureAction', () => {
	it( 'offers Install, and no switch, for a feature whose plugin is missing', () => {
		render(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		expect( screen.getByRole( 'button', { name: 'Install' } ) ).toBeInTheDocument();
		expect( countControls() ).toBe( 1 );
	} );

	it( 'offers one switch for a feature whose plugin is installed', () => {
		render(
			<FeatureAction
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost' }, { status: 'active' } ) }
			/>
		);

		expect( screen.getByRole( 'checkbox', { name: 'Deactivate Jetpack Boost' } ) ).toBeChecked();
		expect( countControls() ).toBe( 1 );
	} );

	it( 'opens, instead of offering Install, a feature a plan runs without its plugin', () => {
		render(
			<FeatureAction
				state={ buildState(
					{ kind: 'install-plugin', plugin: 'jetpack-backup', runsWithoutPlugin: true },
					{
						status: 'active',
						feature: buildFeature( { manage_url: 'https://example.com/backup' } ),
					}
				) }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toHaveAttribute(
			'href',
			'https://example.com/backup'
		);
		expect( countControls() ).toBe( 0 );
	} );

	it( 'installs the named plugin when its Install button is pressed', async () => {
		render(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Install' } ) );

		expect( mockRun ).toHaveBeenCalledWith( {
			plugin: 'jetpack-boost',
			name: 'Jetpack Boost',
			action: 'install',
		} );
	} );

	it( 'deactivates a running plugin, and activates a stopped one', async () => {
		const { unmount } = render(
			<FeatureAction
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost' }, { status: 'active' } ) }
			/>
		);

		await userEvent.click( screen.getByRole( 'checkbox' ) );
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'deactivate' } ) );

		unmount();
		mockRun.mockClear();
		render( <FeatureAction state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost' } ) } /> );

		await userEvent.click( screen.getByRole( 'checkbox' ) );
		expect( mockRun ).toHaveBeenCalledWith( expect.objectContaining( { action: 'activate' } ) );
	} );

	it( 'says Installing… on a disabled button while the install runs', () => {
		mockBusy = true;

		render(
			<FeatureAction state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) } />
		);

		expect( screen.getByRole( 'button', { name: 'Installing…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'offers no Install to a user who cannot install plugins', () => {
		const { container } = render(
			<FeatureAction
				state={ buildState( {
					kind: 'install-plugin',
					plugin: 'jetpack-boost',
					blocked: 'not_permitted',
				} ) }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'offers no Install Jetpack where plugin installs are turned off', () => {
		const { container } = render(
			<FeatureAction
				state={ buildState( { kind: 'install-jetpack', installed: false, blocked: 'disabled' } ) }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'offers to install Jetpack for a feature only Jetpack ships', () => {
		render(
			<FeatureAction state={ buildState( { kind: 'install-jetpack', installed: false } ) } />
		);

		expect( screen.getByRole( 'button', { name: 'Install Jetpack' } ) ).toBeInTheDocument();
	} );

	it( 'activates an installed Jetpack rather than installing it again', () => {
		render(
			<FeatureAction state={ buildState( { kind: 'install-jetpack', installed: true } ) } />
		);

		expect( screen.getByRole( 'button', { name: 'Activate Jetpack' } ) ).toBeInTheDocument();
	} );

	it( 'holds the slot with a placeholder while the live state is still loading', () => {
		render( <FeatureAction state={ buildState( { kind: 'none' }, { pending: true } ) } /> );

		// No control at all until the state that decides which one is known.
		expect( countControls() ).toBe( 0 );
	} );

	it( 'leaves the switch slot empty for a module a host forced on', () => {
		const { container } = render(
			<FeatureAction state={ buildState( { kind: 'module', module: forcedModule } ) } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'leaves the switch slot empty for a plugin a host forced on', () => {
		const { container } = render(
			<FeatureAction
				state={ buildState(
					{ kind: 'plugin', plugin: 'jetpack-boost', override: 'active' },
					{ status: 'active' }
				) }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when this site cannot switch the feature', () => {
		const { container } = render( <FeatureAction state={ buildState( { kind: 'none' } ) } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );

describe( 'FeatureModalActions', () => {
	it( 'offers Upgrade in the header beside the switch', () => {
		render(
			<FeatureModalActions
				state={ buildState(
					{ kind: 'module', module: { ...$module, activated: false } },
					{ feature: buildFeature( { upgrade: { path: '/add-boost', name: 'Jetpack Boost' } } ) }
				) }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Upgrade to Jetpack Boost' } ) ).toHaveAttribute(
			'href',
			'#/add-boost?return_feature=boost'
		);
	} );

	it( 'offers no Install to a user who cannot install plugins', () => {
		render(
			<FeatureModalActions
				state={ buildState( {
					kind: 'install-plugin',
					plugin: 'jetpack-boost',
					blocked: 'not_permitted',
				} ) }
			/>
		);

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'offers Install alone for a feature whose plugin is missing', () => {
		render(
			<FeatureModalActions
				state={ buildState( { kind: 'install-plugin', plugin: 'jetpack-boost' } ) }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Install' } ) ).toBeInTheDocument();
		expect( countControls() ).toBe( 1 );
	} );

	it( 'keeps Install beside Open for a feature a plan runs without its plugin', () => {
		render(
			<FeatureModalActions
				state={ buildState(
					{ kind: 'install-plugin', plugin: 'jetpack-backup', runsWithoutPlugin: true },
					{
						status: 'active',
						feature: buildFeature( { manage_url: 'https://example.com/backup' } ),
					}
				) }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Install' } ) ).toBeInTheDocument();
	} );

	it( 'offers Open beside the switch once the feature is running', () => {
		render(
			<FeatureModalActions
				state={ buildState(
					{ kind: 'plugin', plugin: 'jetpack-boost' },
					{ status: 'active', feature: buildFeature( { manage_url: '/boost' } ) }
				) }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toHaveAttribute( 'href', '/boost' );
		expect(
			screen.getByRole( 'button', { name: 'Deactivate Jetpack Boost' } )
		).toBeInTheDocument();
		expect( countControls() ).toBe( 1 );
	} );

	it( 'follows the value the click asked of the module, not the stored one', () => {
		// Mid-request the store still says on; the button has to say what the card says.
		mockAskedFor = false;

		render( <FeatureModalActions state={ buildState( { kind: 'module', module: $module } ) } /> );

		expect( screen.getByRole( 'button', { name: 'Activate Boost' } ) ).toBeInTheDocument();
	} );

	it( 'offers no Open for a module-backed feature with nowhere to go', () => {
		render( <FeatureModalActions state={ buildState( { kind: 'module', module: $module } ) } /> );

		expect( screen.queryByRole( 'link', { name: 'Open' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Deactivate Boost' } ) ).toBeInTheDocument();
	} );

	it( 'offers Open and says why there is no switch, for a module a host forced on', () => {
		render(
			<FeatureModalActions
				state={ buildState(
					{ kind: 'module', module: forcedModule },
					{
						status: 'active',
						feature: buildFeature( { manage_url: '/wp-admin/admin.php?page=stats' } ),
					}
				) }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Open' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Enabled by your host or site administrator' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the note instead of Deactivate for a plugin a host forced on', () => {
		render(
			<FeatureModalActions
				state={ buildState(
					{ kind: 'plugin', plugin: 'jetpack-boost', override: 'active' },
					{ status: 'active' }
				) }
			/>
		);

		expect( screen.getByText( 'Enabled by your host or site administrator' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'offers no Activate for a plugin a host forced off', () => {
		render(
			<FeatureModalActions
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost', override: 'inactive' } ) }
			/>
		);

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'says why a module forced off cannot be switched, in place of the switch', () => {
		const forcedOff = {
			...forcedModule,
			activated: false,
			override: 'inactive',
		} as MyJetpackModule;

		render( <FeatureModalActions state={ buildState( { kind: 'module', module: forcedOff } ) } /> );

		expect( screen.getByText( /by your host or site administrator/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'FeatureItem', () => {
	it.each( [
		[ 'active', 'Requires a connected WordPress.com account', 'Enabled', false ],
		[ 'active', 'Unavailable in Offline mode', 'Enabled', false ],
		[ 'active', 'Unavailable in Offline mode', 'Enabled', true ],
		[ 'inactive', 'Unavailable in Offline mode', 'Disabled', false ],
		[ 'inactive', 'Unavailable in Offline mode', 'Disabled', true ],
	] as const )(
		'shows the module limitation before the host line in details for override %s: %s (%s, gated: %s)',
		( override, unavailable_reason, hostLabel, gated ) => {
			let state = buildState(
				{
					kind: 'module',
					module: { ...forcedModule, override, available: false, unavailable_reason },
				},
				{ status: 'active' }
			);
			if ( gated ) {
				state = resolveFeatureState(
					{ ...state.feature, product: 'jetpack-ai', module: '', plugin: '' },
					'active',
					undefined,
					{ ai: { ...forcedModule, module: 'ai', override, available: false, unavailable_reason } },
					{}
				);
			}
			expect( state.control.kind ).toBe( gated ? 'none' : 'module' );
			const { rerender } = render( <FeatureItem state={ state } onOpen={ jest.fn() } /> );
			expect( screen.getByText( 'Unavailable' ) ).toBeVisible();
			expect( screen.getByText( unavailable_reason ) ).toBeVisible();
			expect( screen.queryByText( /by your host or site administrator/ ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
			rerender( <FeatureModalActions state={ state } /> );
			const moduleReason = screen.getByText( unavailable_reason );
			const hostReason = screen.getByText( `${ hostLabel } by your host or site administrator` );
			expect( moduleReason ).toBeVisible();
			expect( hostReason ).toBeVisible();
			expect( moduleReason.compareDocumentPosition( hostReason ) ).toBe(
				Node.DOCUMENT_POSITION_FOLLOWING
			);
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		}
	);

	const forcedOn = buildState( { kind: 'module', module: forcedModule }, { status: 'active' } );
	const forcedOff = buildState( { kind: 'plugin', plugin: 'jetpack-boost', override: 'inactive' } );

	it.each( [
		[ 'a module a host forced on', false, 'Active', null, forcedOn ],
		[
			'a module a host forced on',
			true,
			null,
			'Enabled by your host or site administrator',
			forcedOn,
		],
		[ 'a plugin a host forced off', false, 'Inactive', null, forcedOff ],
		[
			'a plugin a host forced off',
			true,
			null,
			'Disabled by your host or site administrator',
			forcedOff,
		],
	] as const )(
		'shows no switch for %s (flag on: %s), with badge %s and host note %s',
		( _, flagOn, badge, note, state ) => {
			setAccountConnect( flagOn );

			render( <FeatureItem state={ state } onOpen={ jest.fn() } /> );

			const shown = ( text: RegExp ) => screen.queryByText( text )?.textContent ?? null;
			expect( shown( /^(Active|Inactive)$/ ) ).toBe( badge );
			expect( shown( /by your host or site administrator/ ) ).toBe( note );
			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
		}
	);
} );

describe( 'FeatureItem install notice', () => {
	const install = ( blocked?: 'disabled' | 'not_permitted' ) =>
		buildState( { kind: 'install-plugin', plugin: 'jetpack-boost', blocked } );

	it( 'tells a user who cannot install plugins who can', () => {
		render( <FeatureItem state={ install( 'not_permitted' ) } onOpen={ jest.fn() } /> );

		expect(
			screen.getByText(
				'Your account can’t install plugins. Ask a site administrator to install Jetpack Boost.'
			)
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Install' } ) ).not.toBeInTheDocument();
	} );

	it( 'says the site has installs turned off, rather than blaming the user', () => {
		render( <FeatureItem state={ install( 'disabled' ) } onOpen={ jest.fn() } /> );

		expect( screen.getByText( /Plugin installs are turned off on this site/ ) ).toBeInTheDocument();
	} );

	it( 'keeps the last failed install on the card, beside Install to try again', () => {
		mockInstallError = 'The plugin could not be downloaded from WordPress.org.';

		render( <FeatureItem state={ install() } onOpen={ jest.fn() } /> );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent(
			'The plugin could not be downloaded from WordPress.org.'
		);
		expect( screen.getByRole( 'button', { name: 'Install' } ) ).toBeEnabled();
	} );

	it( 'says nothing about blocked installs for a feature the plan already runs', () => {
		render(
			<FeatureItem
				state={ buildState( {
					kind: 'install-plugin',
					plugin: 'jetpack-boost',
					runsWithoutPlugin: true,
					blocked: 'disabled',
				} ) }
				onOpen={ jest.fn() }
			/>
		);

		expect( screen.queryByText( /Plugin installs are turned off/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Install' } ) ).not.toBeInTheDocument();
	} );

	it( 'says nothing for an install that has not been tried, or one with nothing in the way', () => {
		render( <FeatureItem state={ install() } onOpen={ jest.fn() } /> );

		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /install plugins/ ) ).not.toBeInTheDocument();
	} );
} );

describe( 'features waiting for an account', () => {
	beforeEach( () => setAccountConnect( true ) );

	const connectionUrl = '/wp-admin/admin.php?connect_url_redirect=1';
	const accountModule = ( activated: boolean ) =>
		resolveFeatureState(
			buildFeature( {
				slug: 'activity-log',
				name: 'Activity Log',
				module: 'activity-log',
				in_jetpack: true,
				plugin: '',
			} ),
			'active',
			undefined,
			{
				'activity-log': {
					module: 'activity-log',
					name: 'Activity Log',
					available: false,
					unavailable_reason: 'Requires a connected WordPress.com account',
					requires_user_connection: true,
					activated,
				} as MyJetpackModule,
			},
			{},
			false,
			true
		);
	const accountPlugin = ( plugin_status: MainFeaturePluginStatus ) =>
		resolveFeatureState(
			buildFeature( {
				slug: 'backup',
				name: 'Backup',
				product: 'backup',
				plugin: 'jetpack-backup',
				plugin_name: 'Jetpack VaultPress Backup',
				plugin_status,
				needs_account: true,
				setup_note: 'Backups start once you add a paid plan.',
			} ),
			'not-installed',
			undefined,
			{},
			{},
			false,
			true
		);
	// Waits for the click's plugin request and whatever was chained on it.
	const settle = async () => {
		await Promise.all( mockRun.mock.results.map( result => result.value ) );
	};

	it.each( [
		[ 'a module that is off', accountModule( false ), 'Connect account for Activity Log' ],
		[ 'a module saved as on', accountModule( true ), 'Connect account for Activity Log' ],
		[ 'a plugin that is off', accountPlugin( 'inactive' ), 'Connect account for Backup' ],
		[ 'a plugin that is on', accountPlugin( 'active' ), 'Connect account for Backup' ],
		[ 'a missing plugin', accountPlugin( 'not-installed' ), 'Install' ],
	] as const )(
		'offers only what is missing on the card for %s, with no badge and no account sentence',
		( _, state, name ) => {
			render( <FeatureItem state={ state } onOpen={ jest.fn() } /> );
			expect( screen.getByRole( 'button', { name } ) ).toHaveAccessibleDescription( '' );
			expect( screen.queryByText( 'Needs user account' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByText( /Requires a connected WordPress.com account/ )
			).not.toBeInTheDocument();
		}
	);

	it( 'says Jetpack AI needs an account, on its card and in its details, while it has no Connect', () => {
		const ai = resolveFeatureState(
			buildFeature( {
				slug: 'jetpack-ai',
				name: 'Jetpack AI',
				product: 'jetpack-ai',
				in_jetpack: true,
				plugin: '',
				needs_account: true,
			} ),
			'active',
			undefined,
			{
				ai: {
					module: 'ai',
					available: false,
					unavailable_reason: 'Requires a connected WordPress.com account',
					requires_user_connection: true,
					activated: false,
				} as MyJetpackModule,
			},
			{},
			false,
			true
		);
		const { rerender } = render( <FeatureItem state={ ai } onOpen={ jest.fn() } /> );
		expect( screen.getByText( 'Requires a connected WordPress.com account' ) ).toBeVisible();
		expect(
			screen.queryByText( /^(Active|Inactive|Needs user account)$/ )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /^Connect/ } ) ).not.toBeInTheDocument();

		rerender( <FeatureModalActions state={ ai } /> );
		expect( screen.getByText( 'Requires a connected WordPress.com account' ) ).toBeVisible();
	} );

	it.each( [
		[ 'card', 'a module', accountModule( false ) ],
		[ 'details', 'a plugin that is on', accountPlugin( 'active' ) ],
	] as const )(
		'connects from the %s for %s and changes nothing on the feature',
		async ( where, _, state ) => {
			render(
				where === 'card' ? (
					<FeatureAction state={ state } />
				) : (
					<FeatureModalActions state={ state } />
				)
			);
			await userEvent.click( screen.getByRole( 'button', { name: /^Connect account for / } ) );

			expect( getUserConnectionUrl ).toHaveBeenCalledWith( {
				redirect_url: expect.stringContaining( '#/features' ),
			} );
			expect( leavePageFor ).toHaveBeenCalledWith( connectionUrl );
			expect( mockRun ).not.toHaveBeenCalled();
			expect( mockSetModuleActive ).not.toHaveBeenCalled();
		}
	);

	const accountJetpack = ( jetpack: MainFeaturePluginStatus ) =>
		resolveFeatureState(
			buildFeature( {
				slug: 'activity-log',
				name: 'Activity Log',
				in_jetpack: true,
				module: 'activity-log',
				plugin: '',
				needs_account: true,
			} ),
			jetpack,
			undefined,
			undefined,
			{},
			false,
			true
		);

	it.each( [
		[ 'Install', true, 'install', accountPlugin( 'not-installed' ), 1 ],
		[ 'Install', false, 'install', accountPlugin( 'not-installed' ), 0 ],
		[ 'Activate Jetpack', true, 'activate', accountJetpack( 'inactive' ), 1 ],
	] as const )(
		'connects after %s only once it succeeds (succeeds: %s), and asks Jetpack not to reload',
		async ( name, succeeds, action, state, connections ) => {
			mockRun.mockReturnValueOnce( Promise.resolve( succeeds ) );
			render( <FeatureAction state={ state } /> );

			await userEvent.click( screen.getByRole( 'button', { name } ) );
			await settle();

			expect( mockRun ).toHaveBeenCalledWith(
				expect.objectContaining( { action, leavesPage: true } )
			);
			expect( leavePageFor ).toHaveBeenCalledTimes( connections );
		}
	);

	it.each( [
		[ 'a module saved as on', accountModule( true ), 'Deactivate Activity Log', [ false ] ],
		[
			'a plugin that is on',
			accountPlugin( 'active' ),
			'Deactivate Jetpack VaultPress Backup',
			[ { plugin: 'jetpack-backup', name: 'Jetpack VaultPress Backup', action: 'deactivate' } ],
		],
	] )(
		'keeps Deactivate beside Connect in the details of %s, without connecting',
		async ( _, state, name, request ) => {
			render( <FeatureModalActions state={ state } /> );
			expect( screen.getByRole( 'button', { name: /^Connect account for / } ) ).toBeVisible();

			await userEvent.click( screen.getByRole( 'button', { name } ) );

			expect( [ ...mockSetModuleActive.mock.calls, ...mockRun.mock.calls ] ).toEqual( [ request ] );
			expect( leavePageFor ).not.toHaveBeenCalled();
		}
	);

	it( 'keeps Deactivate while its request runs, then hands focus to Connect', async () => {
		const on = accountModule( true );
		const { rerender } = render( <FeatureModalActions state={ on } /> );
		const button = screen.getByRole( 'button', { name: 'Deactivate Activity Log' } );
		await userEvent.click( button );

		// While the request is out, the card shows the asked-for value.
		mockAskedFor = false;
		rerender( <FeatureModalActions state={ { ...on, status: 'inactive', isSwitching: true } } /> );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveFocus();

		mockAskedFor = null;
		rerender( <FeatureModalActions state={ accountModule( false ) } /> );
		expect( button ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Connect account for Activity Log' } )
		).toHaveFocus();
	} );

	it( 'offers no Activate in the details while the account is missing', () => {
		render( <FeatureModalActions state={ accountPlugin( 'inactive' ) } /> );
		expect( screen.queryByRole( 'button', { name: /^Activate / } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'a module', accountModule( false ), /then turn it on here if it’s still off\./ ],
		[
			'a plugin',
			accountPlugin( 'inactive' ),
			/Connect your WordPress.com account, then turn it on here\./,
		],
		[
			'a missing plugin',
			accountPlugin( 'not-installed' ),
			/then connects your WordPress.com account/,
		],
		[
			'a plugin already on',
			accountPlugin( 'active' ),
			/^Backups start once you add a paid plan\.$/,
		],
		[
			'a module waiting for Jetpack',
			accountJetpack( 'not-installed' ),
			/Once Jetpack is on you’ll connect your WordPress.com account/,
		],
	] as const )( 'says in the details what happens next for %s', ( _, state, note ) => {
		render( <FeatureDelivery state={ state } /> );
		expect( screen.getByText( note ) ).toBeInTheDocument();
	} );
} );
