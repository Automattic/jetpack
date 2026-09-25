import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureAction } from '../feature-action';
import { FeatureItem } from '../feature-item';
import { FeatureModalActions } from '../feature-modal-actions';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';

const mockRun = jest.fn();

// What a click has asked of the module, when a test wants it to differ from the store.
let mockAskedFor: boolean | null = null;

jest.mock( '../use-main-features', () => ( {
	useFeaturePlugin: ( plugin: string, name: string ) => ( {
		run: ( action: string ) => mockRun( { plugin, name, action } ),
		isBusy: false,
	} ),
} ) );

jest.mock( '../../../module-toggle', () => ( {
	// ds-allow: input -- stands in for the real ModuleToggle, which reaches the modules store.
	ModuleToggle: () => <input type="checkbox" aria-label="Module toggle" readOnly />,
	// Mirrors the hook: `isActive` is the value the switch shows, asked-for or stored.
	useModuleActivation: ( $module: { activated: boolean } ) => ( {
		setModuleActive: jest.fn(),
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

beforeEach( () => {
	mockRun.mockClear();
	mockAskedFor = null;
} );

const countControls = () =>
	screen.queryAllByRole( 'checkbox' ).length + screen.queryAllByRole( 'button' ).length;

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
	it( 'shows only the status for a module a host forced on: no switch, no note', () => {
		const state = buildState(
			{ kind: 'module', module: forcedModule },
			{
				status: 'active',
				feature: buildFeature( { slug: 'stats', name: 'Stats', description: 'See who visits.' } ),
			}
		);

		render( <FeatureItem state={ state } onOpen={ jest.fn() } /> );

		expect( screen.getByText( 'Active' ) ).toBeInTheDocument();
		expect( screen.queryByText( /by your host or site administrator/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'shows only the status for a plugin a host forced off: no switch, no note', () => {
		render(
			<FeatureItem
				state={ buildState( { kind: 'plugin', plugin: 'jetpack-boost', override: 'inactive' } ) }
				onOpen={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Inactive' ) ).toBeInTheDocument();
		expect( screen.queryByText( /by your host or site administrator/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );
} );
