import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureAction } from '../feature-action';
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

	it( 'shows a note instead of a switch for a module a host forced on', () => {
		render( <FeatureAction state={ buildState( { kind: 'module', module: forcedModule } ) } /> );

		expect(
			screen.getByText( 'Turned on by your host or site administrator' )
		).toBeInTheDocument();
		expect( countControls() ).toBe( 0 );
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

	it( 'shows a note instead of Activate or Deactivate for a module a host forced on', () => {
		render(
			<FeatureModalActions
				state={ buildState( { kind: 'module', module: forcedModule }, { status: 'active' } ) }
			/>
		);

		expect(
			screen.getByText( 'Turned on by your host or site administrator' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
