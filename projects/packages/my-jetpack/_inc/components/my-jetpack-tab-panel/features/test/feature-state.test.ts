import { resolveFeatureState } from '../feature-state';
import type { MyJetpackModule } from '../../../../types';

const buildFeature = ( overrides: Partial< MainFeature > = {} ) =>
	( {
		slug: 'feature',
		name: 'Feature',
		in_jetpack: false,
		plugin: '',
		plugin_status: 'not-installed',
		product: '',
		module: '',
		...overrides,
	} ) as MainFeature;

const buildModule = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( { module: 'stats', available: true, activated: true, ...overrides } ) as MyJetpackModule;

const resolve = (
	feature: MainFeature,
	jetpack: MainFeaturePluginStatus,
	modules: Record< string, MyJetpackModule > = {}
) => resolveFeatureState( feature, jetpack, undefined, modules, {} );

describe( 'resolveFeatureState', () => {
	describe( 'with Jetpack active', () => {
		it( 'switches a Jetpack feature by its module', () => {
			const state = resolve( buildFeature( { in_jetpack: true, module: 'stats' } ), 'active', {
				stats: buildModule(),
			} );

			expect( state.control.kind ).toBe( 'module' );
			expect( state.status ).toBe( 'active' );
		} );

		it( 'prefers the module over an installed standalone plugin', () => {
			const feature = buildFeature( {
				in_jetpack: true,
				module: 'publicize',
				plugin: 'jetpack-social',
				plugin_status: 'active',
			} );

			expect(
				resolve( feature, 'active', { publicize: buildModule( { module: 'publicize' } ) } ).control
					.kind
			).toBe( 'module' );
		} );

		it( 'offers Install for a feature only its standalone plugin provides', () => {
			const state = resolve( buildFeature( { plugin: 'jetpack-protect' } ), 'active' );

			expect( state.control ).toEqual( { kind: 'install-plugin', plugin: 'jetpack-protect' } );
			expect( state.status ).toBe( 'inactive' );
		} );

		it( 'switches an installed standalone plugin and reports it', () => {
			const state = resolve(
				buildFeature( { plugin: 'jetpack-boost', plugin_status: 'active' } ),
				'active'
			);

			expect( state.control ).toEqual( { kind: 'plugin', plugin: 'jetpack-boost' } );
			expect( state.status ).toBe( 'active' );
		} );

		it( 'offers nothing when Jetpack ships the feature but its module is unavailable', () => {
			const state = resolve( buildFeature( { in_jetpack: true, module: 'stats' } ), 'active', {
				stats: buildModule( { available: false } ),
			} );

			expect( state.control.kind ).toBe( 'none' );
		} );
	} );

	describe( 'without Jetpack', () => {
		it( 'offers Install Jetpack for a feature only Jetpack ships', () => {
			expect(
				resolve( buildFeature( { in_jetpack: true, module: 'stats' } ), 'not-installed' ).control
			).toEqual( { kind: 'install-jetpack', installed: false } );
		} );

		it( 'offers Activate Jetpack when it is installed but switched off', () => {
			expect(
				resolve( buildFeature( { in_jetpack: true, module: 'stats' } ), 'inactive' ).control
			).toEqual( { kind: 'install-jetpack', installed: true } );
		} );

		it( 'offers the standalone plugin for a feature both ship', () => {
			expect(
				resolve(
					buildFeature( { in_jetpack: true, module: 'blaze', plugin: 'blaze-ads' } ),
					'not-installed'
				).control
			).toEqual( { kind: 'install-plugin', plugin: 'blaze-ads' } );
		} );

		it( 'ignores the modules even if the store still has them', () => {
			const feature = buildFeature( {
				in_jetpack: true,
				module: 'search',
				plugin: 'jetpack-search',
				plugin_status: 'inactive',
			} );

			expect( resolve( feature, 'inactive', { search: buildModule() } ).control ).toEqual( {
				kind: 'plugin',
				plugin: 'jetpack-search',
			} );
		} );
	} );
} );
