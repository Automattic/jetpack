import { renderHook, act } from '@testing-library/react';
import {
	clearRequestedSwitch,
	moduleSwitchKey,
	setRequestedSwitch,
} from '../../../../data/requested-switch-state';
import { useFeatureStates } from '../feature-state';

const mockModules = jest.fn();
const mockConnection = jest.fn();
let mockHasConnectionError = false;

jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => () => ( {
	hasConnectionError: mockHasConnectionError,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( callback: ( select: unknown ) => unknown ) =>
		callback( () => ( {
			getConnectionStatus: () => mockConnection(),
			getIsOfflineMode: () => mockConnection().isOfflineMode,
		} ) ),
} ) );

beforeEach( () => {
	mockConnection.mockReturnValue( {
		isRegistered: true,
		hasConnectedOwner: true,
		isOfflineMode: false,
	} );
	window.myJetpackInitialState.isOfflineFeatures = false;
	window.myJetpackInitialState.myJetpackFlags = {
		accountConnect: true,
	} as typeof window.myJetpackInitialState.myJetpackFlags;
	mockHasConnectionError = false;
} );

jest.mock( '../use-all-jetpack-modules', () => ( {
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
	needs_account: true,
} as MainFeature;

const state = ( jetpack: MainFeaturePluginStatus ) =>
	( { jetpack, features: [ social ] } ) as MainFeaturesState;

describe( 'useFeatureStates', () => {
	it.each( [
		[ 'loading modules', true, true ],
		[ 'no modules and no connected owner', false, false ],
	] )( 'keeps the action pending with %s', ( _, hasConnectedOwner, isLoading ) => {
		mockConnection.mockReturnValue( { isRegistered: true, hasConnectedOwner } );
		mockModules.mockReturnValue( { modules: {}, isLoading } );

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

	it( 'keeps the last module list on screen while the store refreshes it', () => {
		mockModules.mockReturnValue( {
			modules: { publicize: { module: 'publicize', available: true, activated: true } },
			isLoading: true,
		} );

		const { result } = renderHook( () => useFeatureStates( state( 'active' ) ) );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.states[ 0 ].pending ).toBeUndefined();
		expect( result.current.states[ 0 ].control.kind ).toBe( 'module' );
	} );

	it( 'does not wait on a site without Jetpack, where no module can apply', () => {
		mockModules.mockReturnValue( { modules: {}, isLoading: true } );

		const { result } = renderHook( () => useFeatureStates( state( 'not-installed' ) ) );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'install-plugin' );
	} );
} );

describe( 'useFeatureStates, while a module switch is answering a click', () => {
	const inJetpack = { ...social, plugin: '', plugin_status: 'not-installed' } as MainFeature;
	let token = 0;

	beforeEach( () => {
		mockModules.mockReturnValue( {
			modules: { publicize: { module: 'publicize', available: true, activated: true } },
			isLoading: false,
		} );
	} );

	// Cleared through act(): the store is shared, so mounted cards re-render on it.
	afterEach( () => act( () => clearRequestedSwitch( moduleSwitchKey( 'publicize' ), token ) ) );

	it( 'reports the value the click asked for, so the badge can follow the switch', () => {
		const { result } = renderHook( () =>
			useFeatureStates( { jetpack: 'active', features: [ inJetpack ] } as MainFeaturesState )
		);

		expect( result.current.states[ 0 ].status ).toBe( 'active' );

		act( () => {
			token = setRequestedSwitch( moduleSwitchKey( 'publicize' ), false );
		} );

		expect( result.current.states[ 0 ].status ).toBe( 'inactive' );
		expect( result.current.states[ 0 ].pending ).toBeFalsy();
	} );

	it( 'goes back to the store once nothing is in flight', () => {
		const { result } = renderHook( () =>
			useFeatureStates( { jetpack: 'active', features: [ inJetpack ] } as MainFeaturesState )
		);

		act( () => {
			token = setRequestedSwitch( moduleSwitchKey( 'publicize' ), false );
		} );
		act( () => clearRequestedSwitch( moduleSwitchKey( 'publicize' ), token ) );

		expect( result.current.states[ 0 ].status ).toBe( 'active' );
	} );
} );

describe( 'Features account connection gate', () => {
	it.each( [
		[ 'registered without an owner', true, false, false, false, false, true ],
		[ 'owner gone, current admin linked', true, false, true, false, false, false ],
		[ 'owner connected', true, true, false, false, false, false ],
		[ 'unregistered', false, false, false, false, false, false ],
		[ 'offline mode', true, false, false, true, false, false ],
		[ 'offline Features', true, false, false, false, true, false ],
	] )(
		'%s decides whether a module waits for an account',
		(
			name,
			isRegistered,
			hasConnectedOwner,
			isUserConnected,
			isOfflineMode,
			isOfflineFeatures,
			accountNeeded
		) => {
			mockConnection.mockReturnValue( {
				isRegistered,
				hasConnectedOwner,
				isUserConnected,
				isOfflineMode,
			} );
			window.myJetpackInitialState.isOfflineFeatures = isOfflineFeatures as boolean;
			mockModules.mockReturnValue( {
				modules: {
					publicize: {
						module: 'publicize',
						available: true,
						activated: true,
						requires_user_connection: true,
					},
				},
			} );
			const { result } = renderHook( () => useFeatureStates( state( 'active' ) ) );
			expect( result.current.states[ 0 ].control.kind ).toBe( 'module' );
			expect( Boolean( result.current.states[ 0 ].accountNeeded ) ).toBe( accountNeeded );
		}
	);

	it.each( [
		[ 'the account-connect flag is off', false, false ],
		[ 'the connection reports an error', true, true ],
	] )( 'asks for no account on a site without an owner when %s', ( _, flagOn, hasError ) => {
		mockConnection.mockReturnValue( { isRegistered: true, hasConnectedOwner: false } );
		window.myJetpackInitialState.myJetpackFlags = {
			accountConnect: flagOn,
		} as typeof window.myJetpackInitialState.myJetpackFlags;
		mockHasConnectionError = hasError;
		mockModules.mockReturnValue( { modules: {} } );

		const { result } = renderHook( () => useFeatureStates( state( 'not-installed' ) ) );

		expect( result.current.states[ 0 ].control.kind ).toBe( 'install-plugin' );
		expect( result.current.states[ 0 ].accountNeeded ).toBeUndefined();
	} );
} );
