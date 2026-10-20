import { act, renderHook } from '@testing-library/react';
import { useApplySetupModules, useSetupModules } from '../use-setup-modules';
import type { SetupModule } from '../use-setup-modules';

const mockRequestModuleSwitch = jest.fn();

jest.mock( '../../../../data/module-switch', () => ( {
	__esModule: true,
	requestModuleSwitch: ( ...args: unknown[] ) => mockRequestModuleSwitch( ...args ),
} ) );

const mockStore: { modules: Record< string, object >; isLoading: boolean; resolved: boolean } = {
	modules: {},
	isLoading: false,
	resolved: true,
};

jest.mock( '@automattic/jetpack-shared-stores', () => ( { __esModule: true, store: 'modules' } ) );

jest.mock( '@wordpress/data', () => ( {
	__esModule: true,
	useSelect: ( read: ( select: () => object ) => unknown ) =>
		read( () => ( {
			getJetpackModules: () => mockStore.modules,
			areModulesLoading: () => mockStore.isLoading,
			hasFinishedResolution: () => mockStore.resolved,
		} ) ),
	useDispatch: () => ( { updateJetpackModuleStatus: jest.fn() } ),
} ) );

const module = ( slug: SetupModule[ 'slug' ], activated: boolean, locked = false ) =>
	( {
		slug,
		name: slug,
		description: '',
		icon: null,
		activated,
		locked,
	} ) as unknown as SetupModule;

beforeEach( () => {
	mockRequestModuleSwitch.mockReset();
	mockStore.modules = {};
	mockStore.isLoading = false;
	mockStore.resolved = true;
} );

describe( 'Applying the wizard’s switches', () => {
	it( 'asks only for the switches the user moved, and reports each one', async () => {
		mockRequestModuleSwitch.mockImplementation( ( _toggle, slug ) =>
			Promise.resolve( slug === 'stats' )
		);
		const { result } = renderHook( () => useApplySetupModules() );

		let results;
		await act( async () => {
			results = await result.current.apply(
				[ module( 'stats', true ), module( 'monitor', false ), module( 'contact-form', false ) ],
				{ stats: false, monitor: true }
			);
		} );

		expect( mockRequestModuleSwitch ).toHaveBeenCalledTimes( 2 );
		expect( mockRequestModuleSwitch ).toHaveBeenCalledWith( expect.anything(), 'stats', false );
		expect( mockRequestModuleSwitch ).toHaveBeenCalledWith( expect.anything(), 'monitor', true );
		expect( results ).toEqual( [
			{ slug: 'stats', name: 'stats', wanted: false, ok: true, changed: true },
			// A failed switch is reported, never folded into the rest.
			{ slug: 'monitor', name: 'monitor', wanted: true, ok: false, changed: true },
			{ slug: 'contact-form', name: 'contact-form', wanted: false, ok: true, changed: false },
		] );
	} );

	it( 'never asks to move a module the host forces', async () => {
		const { result } = renderHook( () => useApplySetupModules() );

		await act( async () => {
			await result.current.apply( [ module( 'monitor', false, true ) ], { monitor: true } );
		} );

		expect( mockRequestModuleSwitch ).not.toHaveBeenCalled();
	} );

	it( 'reports applying until the last switch answers', async () => {
		let answer: ( ok: boolean ) => void = () => {};
		mockRequestModuleSwitch.mockReturnValue( new Promise( resolve => ( answer = resolve ) ) );
		const { result } = renderHook( () => useApplySetupModules() );

		let running: Promise< unknown > = Promise.resolve();
		act( () => {
			running = result.current.apply( [ module( 'monitor', false ) ], { monitor: true } );
		} );
		expect( result.current.isApplying ).toBe( true );

		await act( async () => {
			answer( true );
			await running;
		} );
		expect( result.current.isApplying ).toBe( false );
	} );
} );

describe( 'The modules the wizard offers', () => {
	// Only a connected user reaches the step that lists them, so reading earlier is wasted.
	it( 'does not read the modules until it is enabled', () => {
		mockStore.modules = { stats: { name: 'Stats', description: '', activated: true } };

		const { result } = renderHook( () => useSetupModules( undefined, false ) );

		expect( result.current ).toEqual( { modules: [], isLoading: true } );
	} );

	// A reload straight onto the feature step must not say the list failed to load.
	it( 'is loading until the request has finished, not only while it runs', () => {
		mockStore.resolved = false;

		const { result } = renderHook( () => useSetupModules() );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'locks host-forced modules and leaves out ones Jetpack does not have here', () => {
		mockStore.modules = {
			stats: { name: 'Stats', description: '', activated: true, override: 'active' },
			monitor: { name: 'Monitor', description: '', activated: false },
		};

		const { result } = renderHook( () => useSetupModules() );

		expect( result.current.modules.map( ( { slug, locked } ) => ( { slug, locked } ) ) ).toEqual( [
			{ slug: 'stats', locked: true },
			{ slug: 'monitor', locked: false },
		] );
	} );
} );
