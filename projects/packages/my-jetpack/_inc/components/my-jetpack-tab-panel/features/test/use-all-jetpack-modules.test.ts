import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement } from 'react';
import { getForcedReason, useFeatureStates } from '../feature-state';
import { useAllJetpackModules, withoutPluginForcedOverrides } from '../use-all-jetpack-modules';
import { useBulkFeatureSwitch } from '../use-bulk-feature-switch';
import { QUERY_KEY, useFeaturePlugin, useMainFeatures } from '../use-main-features';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';
import type { ReactNode } from 'react';

const mockModules: { current: Record< string, MyJetpackModule > | null } = { current: {} };
const mockProducts: { current: Record< string, ProductCamelCase > } = { current: {} };
const mockGetJetpackModules = jest.fn( () => mockModules.current );
const mockOfflineSeed: { current?: OfflineFeaturesSeed } = {};
const mockFetchModules = jest.fn();
let mockResolved = true;
let mockFailed = false;

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: jest.fn(), createErrorNotice: jest.fn() } ),
} ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( { myJetpack: { offlineFeatures: mockOfflineSeed.current } } ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => () => ( {
	hasConnectionError: false,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: mockFetchModules,
	} ),
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( {
			getJetpackModules: mockGetJetpackModules,
			areModulesLoading: () => false,
			hasFinishedResolution: () => mockResolved,
			hasResolutionFailed: () => mockFailed,
		} ) ),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: mockProducts.current } ),
} ) );

jest.mock( '../use-main-features', () => ( {
	...jest.requireActual( '../use-main-features' ),
	useMainFeatures: jest.fn(),
} ) );

const jetpackIs = ( jetpack: MainFeaturesState[ 'jetpack' ] ) =>
	jest
		.mocked( useMainFeatures )
		.mockReturnValue( { jetpack, features: [], isPlaceholderData: false } );

const mod = ( module: string, override: MyJetpackModule[ 'override' ] ) =>
	( { module, available: true, activated: override !== 'inactive', override } ) as MyJetpackModule;

const product = ( slug: string, isStandaloneActive: boolean ) =>
	( { slug, standalonePluginInfo: { isStandaloneActive } } ) as unknown as ProductCamelCase;

describe( 'withoutPluginForcedOverrides', () => {
	beforeEach( () => {
		window.myJetpackInitialState = { myJetpackFlags: {} } as typeof window.myJetpackInitialState;
	} );

	it( 'clears a forced-on override its own active standalone plugin put there', () => {
		const modules = { videopress: mod( 'videopress', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, {
			videopress: product( 'videopress', true ),
		} );

		expect( result.videopress.override ).toBe( false );
	} );

	it( 'keeps the override while that plugin is not active, so a host forcing it still shows', () => {
		const modules = { videopress: mod( 'videopress', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, {
			videopress: product( 'videopress', false ),
		} );

		expect( result.videopress.override ).toBe( 'active' );
	} );

	it( 'keeps a forced-off override, which no plugin of its own could cause', () => {
		const modules = { videopress: mod( 'videopress', 'inactive' ) };

		const result = withoutPluginForcedOverrides( modules, {
			videopress: product( 'videopress', true ),
		} );

		expect( result.videopress.override ).toBe( 'inactive' );
	} );

	it( 'follows a product to the module it runs when the slugs differ', () => {
		const modules = { publicize: mod( 'publicize', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, { social: product( 'social', true ) } );

		expect( result.publicize.override ).toBe( false );
	} );

	it( 'leaves a module with no standalone plugin alone', () => {
		const modules = { stats: mod( 'stats', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, { stats: product( 'stats', false ) } );

		expect( result.stats ).toBe( modules.stats );
	} );
} );

describe( 'useAllJetpackModules', () => {
	beforeEach( () => {
		mockResolved = true;
		mockFailed = false;
		window.myJetpackInitialState = { myJetpackFlags: {} } as typeof window.myJetpackInitialState;
		jetpackIs( 'active' );
		mockGetJetpackModules.mockClear();
	} );

	it.each( [ false, true ] )( 'reports whether the module request has finished: %s', resolved => {
		mockResolved = resolved;
		const { result } = renderHook( () => useAllJetpackModules() );
		expect( result.current.hasLoaded ).toBe( resolved );
	} );

	it.each( [ false, true ] )( 'reports whether the module request failed: %s', failed => {
		mockFailed = failed;
		const { result } = renderHook( () => useAllJetpackModules() );
		expect( result.current.hasFailed ).toBe( failed );
	} );

	it( 'returns a null module list offline without throwing', () => {
		window.myJetpackInitialState = {
			isOfflineFeatures: true,
		} as typeof window.myJetpackInitialState;
		mockModules.current = null;

		const { result } = renderHook( () => useAllJetpackModules() );

		expect( result.current.modules ).toBeNull();
	} );

	it( 'hands back the store modules without the override a standalone plugin causes', () => {
		mockModules.current = {
			videopress: mod( 'videopress', 'active' ),
			stats: mod( 'stats', 'active' ),
		};
		mockProducts.current = { videopress: product( 'videopress', true ) };

		const { result } = renderHook( () => useAllJetpackModules() );

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.modules.videopress.override ).toBe( false );
		expect( result.current.modules.stats.override ).toBe( 'active' );
	} );

	it.each( [ 'inactive', 'not-installed' ] as const )(
		'does not ask for the modules while the Jetpack plugin is %s',
		status => {
			jetpackIs( status );

			const { result } = renderHook( () => useAllJetpackModules() );

			expect( mockGetJetpackModules ).not.toHaveBeenCalled();
			expect( result.current ).toEqual( {
				modules: {},
				isLoading: false,
				hasLoaded: true,
				hasFailed: false,
			} );
		}
	);

	it.each( [
		[ 'offline keeps the plugin switch until fresh modules arrive', true ],
		[ 'online shows the host label until modules refresh', false ],
	] as const )( '%s', ( _scenario, offline ) => {
		window.myJetpackInitialState = {
			isOfflineFeatures: offline,
			myJetpackFlags: {},
		} as typeof window.myJetpackInitialState;
		const feature = {
			slug: 'videopress',
			product: 'videopress',
			plugin: 'jetpack-videopress',
			plugin_status: 'inactive',
			in_jetpack: true,
		} as MainFeature;
		const state: MainFeaturesState = { jetpack: 'active', features: [ feature ] };
		mockProducts.current = { videopress: product( 'videopress', false ) };
		mockModules.current = {
			videopress: { ...mod( 'videopress', false ), available: false, activated: false },
		};
		mockOfflineSeed.current = {
			mainFeatures: {
				jetpack: state.jetpack,
				features: state.features.map( item => ( { ...item, upgrade: null } ) ),
			},
			plugins: {},
		};
		jest.mocked( useMainFeatures ).mockReturnValue( { ...state, isPlaceholderData: false } );
		const view = renderHook( current => useFeatureStates( current ), {
			initialProps: state,
		} );
		let { result, rerender } = view;

		expect( result.current.states[ 0 ].status ).toBe( 'inactive' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );

		mockModules.current = {
			videopress: { ...mod( 'videopress', 'active' ), available: false, activated: ! offline },
		};
		mockProducts.current = { videopress: product( 'videopress', true ) };
		const activated: MainFeaturesState = {
			...state,
			features: [ { ...feature, plugin_status: 'active' } ],
		};
		jest.mocked( useMainFeatures ).mockReturnValue( { ...activated, isPlaceholderData: false } );
		rerender( activated );

		expect( result.current.states[ 0 ].status ).toBe( 'active' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBeNull();

		mockProducts.current = { videopress: product( 'videopress', false ) };
		jest.mocked( useMainFeatures ).mockReturnValue( { ...state, isPlaceholderData: false } );
		rerender( state );

		expect( result.current.states[ 0 ].status ).toBe( offline ? 'inactive' : 'active' );
		expect( result.current.states[ 0 ].control.kind ).toBe( offline ? 'plugin' : 'module' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBe(
			offline ? null : 'Enabled by your host or site administrator'
		);

		view.unmount();
		( { result, rerender } = renderHook( current => useFeatureStates( current ), {
			initialProps: state,
		} ) );
		expect( result.current.states[ 0 ].control.kind ).toBe( offline ? 'plugin' : 'module' );

		mockModules.current = {
			videopress: { ...mod( 'videopress', false ), available: false, activated: false },
		};
		rerender( state );

		expect( result.current.states[ 0 ].status ).toBe( 'inactive' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBeNull();

		mockModules.current = {
			videopress: { ...mod( 'videopress', 'active' ), available: false },
		};
		rerender( state );

		expect( result.current.states[ 0 ].control.kind ).toBe( 'module' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBe(
			'Enabled by your host or site administrator'
		);
	} );
} );

describe( 'the shared module request gate', () => {
	it.each( [
		[ 'offline seed with Jetpack inactive', true, 'inactive', 0 ],
		[ 'online Jetpack inactive', false, 'inactive', 0 ],
		[ 'online Jetpack active', false, 'active', 1 ],
	] as const )( 'requests modules only when active: %s', ( _case, offline, jetpack, requests ) => {
		const state: MainFeaturesState = { jetpack, features: [] };
		mockOfflineSeed.current = {
			mainFeatures: {
				jetpack: state.jetpack,
				features: state.features.map( item => ( { ...item, upgrade: null } ) ),
			},
			plugins: {},
		};
		window.myJetpackInitialState = {
			isOfflineFeatures: offline,
			mainFeatures: offline ? { jetpack: 'active', features: [] } : state,
		} as typeof window.myJetpackInitialState;
		jest
			.mocked( useMainFeatures )
			.mockImplementation( jest.requireActual( '../use-main-features' ).useMainFeatures );
		jest.mocked( apiFetch ).mockImplementation( () => new Promise( () => {} ) );
		mockGetJetpackModules.mockClear();
		mockModules.current = {};
		mockProducts.current = {};
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: false, gcTime: Infinity } },
		} );
		const { result, unmount } = renderHook( () => useAllJetpackModules(), {
			wrapper: ( { children }: { children: ReactNode } ) =>
				createElement( QueryClientProvider, { client }, children ),
		} );

		expect( mockGetJetpackModules ).toHaveBeenCalledTimes( requests );
		expect( result.current.isLoading ).toBe( false );
		unmount();
		client.clear();
	} );
} );

describe( 'plugin switch refresh ordering', () => {
	const startSwitch = async (
		mode: 'single' | 'bulk',
		success: boolean,
		jetpack: MainFeaturesState[ 'jetpack' ]
	) => {
		window.myJetpackInitialState = {
			isOfflineFeatures: true,
		} as typeof window.myJetpackInitialState;
		const feature = {
			slug: 'videopress',
			product: 'videopress',
			plugin: 'jetpack-videopress',
			plugin_status: 'active',
			in_jetpack: true,
		} as MainFeature;
		const active: MainFeaturesState = { jetpack, features: [ feature ] };
		const inactive: MainFeaturesState = {
			...active,
			features: [ { ...feature, plugin_status: 'inactive' } ],
		};
		const client = new QueryClient( {
			defaultOptions: { queries: { retry: false, gcTime: Infinity } },
		} );
		client.setQueryData( QUERY_KEY, active );
		jest
			.mocked( useMainFeatures )
			.mockImplementation( jest.requireActual( '../use-main-features' ).useMainFeatures );
		mockModules.current = { videopress: { ...mod( 'videopress', 'active' ), available: false } };
		let settleFeatures: ( state: MainFeaturesState ) => void = () => {};
		jest
			.mocked( apiFetch )
			.mockClear()
			.mockImplementation( ( { method } ) =>
				method === 'POST' && ! success
					? Promise.reject( new Error( 'Switch failed after deactivation' ) )
					: new Promise( resolve => {
							settleFeatures = resolve;
						} )
			);
		const readWith: MainFeaturePluginStatus[] = [];
		const deliverHostOverride = () => {
			readWith.push(
				client.getQueryData< MainFeaturesState >( QUERY_KEY )!.features[ 0 ].plugin_status
			);
			mockModules.current = {
				videopress: { ...mod( 'videopress', 'active' ), available: false },
			};
		};
		let settleModules: () => void = () => {};
		mockFetchModules.mockReset().mockImplementation( () => {
			deliverHostOverride();
			return new Promise( resolve => {
				settleModules = () => resolve( true );
			} );
		} );
		const view = renderHook(
			() => ( {
				states: useFeatureStates( useMainFeatures() ).states,
				plugin: useFeaturePlugin( 'jetpack-videopress', 'VideoPress' ),
				bulk: useBulkFeatureSwitch(),
			} ),
			{
				wrapper: ( { children }: { children: ReactNode } ) =>
					createElement( QueryClientProvider, { client }, children ),
			}
		);
		let request: Promise< unknown > = Promise.resolve();
		act( () => {
			request =
				mode === 'single'
					? view.result.current.plugin.run( 'deactivate' )
					: view.result.current.bulk.run( view.result.current.states, false );
		} );
		const postRequest = expect.objectContaining( { method: 'POST' } );
		await waitFor( () =>
			expect( apiFetch ).toHaveBeenCalledWith(
				success ? postRequest : { path: '/wpcom/v2/my-jetpack/site/features' }
			)
		);
		view.rerender();
		await act( async () => {
			settleFeatures( inactive );
		} );

		return {
			...view,
			client,
			inactive,
			readWith,
			finish: async () => {
				await act( async () => {
					settleModules();
					await request;
				} );
				view.rerender();
			},
		};
	};

	it.each( [
		[ 'single', false ],
		[ 'bulk', false ],
		[ 'single', true ],
	] as const )(
		'%s reads features before refreshing module overrides (success: %s)',
		async ( mode, success ) => {
			const { result, rerender, readWith, finish, unmount, client } = await startSwitch(
				mode,
				success,
				'active'
			);

			await waitFor( () => expect( readWith ).toEqual( [ 'inactive' ] ) );
			rerender();
			expect(
				mode === 'single' ? result.current.plugin.isBusy : result.current.bulk.isRunning
			).toBe( true );
			await finish();
			expect( result.current.plugin.isBusy ).toBe( false );
			expect( result.current.states[ 0 ].control.kind ).toBe( 'module' );
			expect( getForcedReason( result.current.states[ 0 ] ) ).toBe(
				'Enabled by your host or site administrator'
			);
			expect( readWith ).toEqual( [ 'inactive' ] );
			unmount();
			client.clear();
		}
	);

	it.each( [ true, false ] )(
		'skips the module refresh while Jetpack is inactive (success: %s)',
		async success => {
			const { result, finish, unmount, client, inactive } = await startSwitch(
				'single',
				success,
				'inactive'
			);

			await finish();
			expect( result.current.plugin.isBusy ).toBe( false );
			expect( mockFetchModules ).not.toHaveBeenCalled();
			expect( client.getQueryData( QUERY_KEY ) ).toEqual( inactive );
			unmount();
			client.clear();
		}
	);
} );
