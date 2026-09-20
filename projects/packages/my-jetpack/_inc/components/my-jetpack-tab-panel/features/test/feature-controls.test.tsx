import { render, screen } from '@testing-library/react';
import { FeatureAction } from '../feature-action';
import { FeatureModalActions } from '../feature-modal-actions';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';

jest.mock( '../use-main-features', () => ( {
	useFeaturePlugin: () => ( { run: jest.fn(), isBusy: false } ),
} ) );

jest.mock( '../../../module-toggle', () => ( {
	// ds-allow: input -- stands in for the real ModuleToggle, which reaches the modules store.
	ModuleToggle: () => <input type="checkbox" aria-label="Module toggle" readOnly />,
	useModuleActivation: () => ( { setModuleActive: jest.fn(), isUpdating: false } ),
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

	it( 'offers no Open for a module-backed feature with nowhere to go', () => {
		render( <FeatureModalActions state={ buildState( { kind: 'module', module: $module } ) } /> );

		expect( screen.queryByRole( 'link', { name: 'Open' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Deactivate Boost' } ) ).toBeInTheDocument();
	} );
} );
