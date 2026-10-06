import { renderHook } from '@testing-library/react';
import { getForcedReason, useFeatureStates } from '../feature-state';
import { useAllJetpackModules, withoutPluginForcedOverrides } from '../use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';

const mockModules: { current: Record< string, MyJetpackModule > } = { current: {} };
const mockProducts: { current: Record< string, ProductCamelCase > } = { current: {} };

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		myJetpack: {
			offlineFeatures: {
				mainFeatures: {
					jetpack: 'active',
					features: [ { product: 'videopress', plugin_status: 'inactive' } ],
				},
			},
		},
	} ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( {
			getJetpackModules: () => mockModules.current,
			areModulesLoading: () => false,
		} ) ),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: mockProducts.current } ),
} ) );

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
		window.myJetpackInitialState = { myJetpackFlags: {} } as typeof window.myJetpackInitialState;
	} );

	it( 'hands back the store modules without the override a standalone plugin causes', () => {
		mockModules.current = {
			videopress: mod( 'videopress', 'active' ),
			stats: mod( 'stats', 'active' ),
		};
		mockProducts.current = { videopress: product( 'videopress', true ) };

		const { result } = renderHook( () =>
			useAllJetpackModules( { jetpack: 'active', features: [] } )
		);

		expect( result.current.isLoading ).toBe( false );
		expect( result.current.modules.videopress.override ).toBe( false );
		expect( result.current.modules.stats.override ).toBe( 'active' );
	} );

	it( 'keeps the offline plugin switch current after activation and deactivation', () => {
		window.myJetpackInitialState = {
			isOfflineFeatures: true,
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
		mockProducts.current = {};
		mockModules.current = {
			videopress: { ...mod( 'videopress', false ), available: false, activated: false },
		};
		const { result, rerender } = renderHook( current => useFeatureStates( current ), {
			initialProps: state,
		} );

		expect( result.current.states[ 0 ].status ).toBe( 'inactive' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );

		mockModules.current = {
			videopress: { ...mod( 'videopress', 'active' ), available: false },
		};
		rerender( { ...state, features: [ { ...feature, plugin_status: 'active' } ] } );

		expect( result.current.states[ 0 ].status ).toBe( 'active' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBeNull();

		mockModules.current = {
			videopress: { ...mod( 'videopress', false ), available: false, activated: false },
		};
		rerender( state );

		expect( result.current.states[ 0 ].status ).toBe( 'inactive' );
		expect( result.current.states[ 0 ].control.kind ).toBe( 'plugin' );
		expect( getForcedReason( result.current.states[ 0 ] ) ).toBeNull();
	} );
} );
