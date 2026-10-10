import { renderHook } from '@testing-library/react';
import { useAllJetpackModules, withoutPluginForcedOverrides } from '../use-all-jetpack-modules';
import { useMainFeatures } from '../use-main-features';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';

const mockModules: { current: Record< string, MyJetpackModule > } = { current: {} };
const mockProducts: { current: Record< string, ProductCamelCase > } = { current: {} };
const mockGetJetpackModules = jest.fn( () => mockModules.current );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: unknown ) => unknown ) =>
		selector( () => ( {
			getJetpackModules: mockGetJetpackModules,
			areModulesLoading: () => false,
		} ) ),
} ) );

jest.mock( '../../../../data/products/use-all-products', () => ( {
	useAllProducts: () => ( { data: mockProducts.current } ),
} ) );

jest.mock( '../use-main-features', () => ( { useMainFeatures: jest.fn() } ) );

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
		window.myJetpackInitialState = { myJetpackFlags: {} } as typeof window.myJetpackInitialState;
		jetpackIs( 'active' );
		mockGetJetpackModules.mockClear();
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
			expect( result.current ).toEqual( { modules: {}, isLoading: false } );
		}
	);
} );
