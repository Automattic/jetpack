import { renderHook } from '@testing-library/react';
import { useFeatureStates } from '../feature-state';

const mockModules = jest.fn();

jest.mock( '../../products/use-all-jetpack-modules', () => ( {
	useAllJetpackModules: () => mockModules(),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: {} } ),
} ) );

// Social ships in Jetpack as the 'publicize' module and as a standalone plugin that is
// not installed here — the shape that reads as "install the plugin" if modules are missing.
const social = {
	slug: 'social',
	name: 'Social',
	in_jetpack: true,
	plugin: 'jetpack-social',
	plugin_status: 'not-installed',
	product: 'social',
	module: '',
} as MainFeature;

const state = ( jetpack: MainFeaturePluginStatus ) =>
	( { jetpack, features: [ social ] } ) as MainFeaturesState;

describe( 'useFeatureStates', () => {
	it( 'waits for the modules rather than offering to install what Jetpack already runs', () => {
		mockModules.mockReturnValue( { modules: {}, isLoading: true } );

		const { result } = renderHook( () => useFeatureStates( state( 'active' ) ) );

		expect( result.current.isLoading ).toBe( true );

		// The copy is already right, so the card renders; only its live half waits.
		expect( result.current.states[ 0 ].pending ).toBe( true );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'none' );
	} );

	it( 'resolves the module once the modules have landed', () => {
		mockModules.mockReturnValue( {
			modules: { publicize: { module: 'publicize', available: true, activated: true } },
			isLoading: false,
		} );

		const { result } = renderHook( () => useFeatureStates( state( 'active' ) ) );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'module' );
		expect( result.current.states[ 0 ].status ).toBe( 'active' );
	} );

	it( 'does not wait on a site without Jetpack, where no module can apply', () => {
		mockModules.mockReturnValue( { modules: {}, isLoading: true } );

		const { result } = renderHook( () => useFeatureStates( state( 'not-installed' ) ) );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'install-plugin' );
	} );
} );
