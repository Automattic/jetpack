import { PRODUCT_STATUSES } from '../../../../constants';
import { PRODUCT_MODULES } from '../../products/mappings';
import { resolveFeatureState } from '../feature-state';
import type { ProductCamelCase } from '../../../../data/types';
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

		it( 'carries a host override on an installed standalone plugin', () => {
			const state = resolve(
				buildFeature( {
					plugin: 'jetpack-boost',
					plugin_status: 'inactive',
					plugin_override: 'inactive',
				} ),
				'active'
			);

			expect( state.control ).toEqual( {
				kind: 'plugin',
				plugin: 'jetpack-boost',
				override: 'inactive',
			} );
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

describe( 'resolveFeatureState, for a product the module map has dropped', () => {
	// The AI pre-release gate removes the entry rather than mapping it, and the product
	// slug is not a module slug, so falling back to it would resolve nothing.
	const gated = ( () => {
		const map = { ...PRODUCT_MODULES };
		delete map[ 'jetpack-ai' ];
		return map;
	} )();

	const ai = buildFeature( { slug: 'jetpack-ai', in_jetpack: true, product: 'jetpack-ai' } );
	const aiModules = { ai: buildModule( { module: 'ai' } ) } as Record< string, MyJetpackModule >;

	it( 'offers no switch while the gate hides the module', () => {
		expect( resolveFeatureState( ai, 'active', undefined, aiModules, gated ).control.kind ).toBe(
			'none'
		);
	} );

	it( 'still reports the product as running, so the card does not call it Inactive', () => {
		const product = { status: PRODUCT_STATUSES.ACTIVE } as ProductCamelCase;

		expect( resolveFeatureState( ai, 'active', product, aiModules, gated ).status ).toBe(
			'active'
		);
		expect( resolveFeatureState( ai, 'active', undefined, aiModules, gated ).status ).toBe(
			'inactive'
		);
	} );

	it( 'uses the mapped module for a product the gate left alone', () => {
		const social = buildFeature( { in_jetpack: true, product: 'social' } );
		const modules = { publicize: buildModule( { module: 'publicize' } ) };

		expect( resolveFeatureState( social, 'active', undefined, modules, gated ).control.kind ).toBe(
			'module'
		);
	} );
} );

describe( 'resolveFeatureState, for a feature its own plugin switches', () => {
	// Protect ships in Jetpack and as a plugin, and the map names the plugin as the
	// switch. The sidebar still counts the module, so the badge has to as well.
	const protect = buildFeature( {
		slug: 'protect',
		in_jetpack: false,
		plugin: 'jetpack-protect',
		plugin_status: 'not-installed',
		module: 'protect',
	} );

	const runningModule = { protect: buildModule( { module: 'protect' } ) };

	it( 'reads the module for status while still offering to install the plugin', () => {
		const state = resolveFeatureState( protect, 'active', undefined, runningModule, {} );

		expect( state.status ).toBe( 'active' );
		expect( state.control.kind ).toBe( 'install-plugin' );
	} );

	it( 'is inactive when neither the plugin nor the module is running', () => {
		const off = { protect: buildModule( { module: 'protect', activated: false } ) };

		expect( resolveFeatureState( protect, 'active', undefined, off, {} ).status ).toBe(
			'inactive'
		);
	} );

	it( 'ignores the module on a site without Jetpack', () => {
		expect(
			resolveFeatureState( protect, 'not-installed', undefined, runningModule, {} ).status
		).toBe( 'inactive' );
	} );
} );

describe( 'resolveFeatureState, for a feature a plan runs without its plugin', () => {
	const backup = buildFeature( {
		slug: 'backup',
		plugin: 'jetpack-backup',
		plugin_status: 'not-installed',
		product: 'backup',
	} );

	const withProduct = ( product: ProductCamelCase ) =>
		resolveFeatureState( backup, 'active', product, {}, {} );

	it( 'is active and opens in place of Install when a paid plan runs it', () => {
		const state = withProduct( {
			hasPaidPlanForProduct: true,
			status: PRODUCT_STATUSES.ACTIVE,
		} as ProductCamelCase );

		expect( state.status ).toBe( 'active' );
		expect( state.control ).toEqual( {
			kind: 'install-plugin',
			plugin: 'jetpack-backup',
			runsWithoutPlugin: true,
		} );
	} );

	it( 'still offers Install when no paid plan covers it', () => {
		const state = withProduct( {
			hasPaidPlanForProduct: false,
			status: PRODUCT_STATUSES.ACTIVE,
		} as ProductCamelCase );

		expect( state.status ).toBe( 'inactive' );
		expect( state.control ).toEqual( { kind: 'install-plugin', plugin: 'jetpack-backup' } );
	} );

	it( 'still offers Install when the plan covers it but it is not running', () => {
		const state = withProduct( {
			hasPaidPlanForProduct: true,
			status: PRODUCT_STATUSES.ABSENT_WITH_PLAN,
		} as ProductCamelCase );

		expect( state.status ).toBe( 'inactive' );
		expect( state.control ).toEqual( { kind: 'install-plugin', plugin: 'jetpack-backup' } );
	} );
} );
