import { withoutPluginForcedOverrides } from '../use-all-jetpack-modules';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';

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
		const modules = { vaultpress: mod( 'vaultpress', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, { backup: product( 'backup', true ) } );

		expect( result.vaultpress.override ).toBe( false );
	} );

	it( 'leaves a module with no standalone plugin alone', () => {
		const modules = { stats: mod( 'stats', 'active' ) };

		const result = withoutPluginForcedOverrides( modules, { stats: product( 'stats', false ) } );

		expect( result.stats ).toBe( modules.stats );
	} );
} );
