import { PRODUCT_STATUSES } from '../../../../constants';
import { getFeatureManageUrl, getForcedReason, resolveFeatureState } from '../feature-state';
import { PRODUCT_MODULES } from '../mappings';
import { getFeatureUnavailableReason, isFeatureAvailable } from '../module-availability';
import { getModuleFeatureState } from '../use-more-features';
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

		it( 'keeps a network-activated plugin forced on while explaining its unavailable module', () => {
			const feature = buildFeature( {
				in_jetpack: true,
				module: 'videopress',
				plugin: 'jetpack-videopress',
				plugin_status: 'active',
				plugin_override: 'active',
			} );
			const state = resolve( feature, 'active', {
				videopress: buildModule( {
					module: 'videopress',
					available: false,
					unavailable_reason: 'Unavailable in Offline mode',
				} ),
			} );
			expect( state.status ).toBe( 'active' );
			expect( state.control ).toEqual( {
				kind: 'plugin',
				plugin: 'jetpack-videopress',
				override: 'active',
			} );
			expect( state.moduleUnavailableReason ).toBe( 'Unavailable in Offline mode' );
			expect( getForcedReason( state ) ).toBe( 'Enabled by your host or site administrator' );
		} );

		it( 'retains an unavailable module and its reason without a switch', () => {
			const state = resolve( buildFeature( { in_jetpack: true, module: 'stats' } ), 'active', {
				stats: buildModule( {
					available: false,
					unavailable_reason: 'Unavailable in Offline mode',
				} ),
			} );

			expect( state.control.kind ).toBe( 'module' );
			expect( getForcedReason( state ) ).toBe( 'Unavailable in Offline mode' );
			expect( state.status ).toBe( 'inactive' );
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

	it.each( [
		[ false, 'Unavailable in Offline mode' ],
		[ 'active', 'Enabled by your host or site administrator' ],
		[ 'inactive', 'Disabled by your host or site administrator' ],
	] as const )(
		'explains an unavailable gated AI module with override %s',
		( override, reason ) => {
			const modules = {
				ai: buildModule( {
					module: 'ai',
					available: false,
					unavailable_reason: 'Unavailable in Offline mode',
					override,
				} ),
			};
			const state = resolveFeatureState( ai, 'active', undefined, modules, gated );
			expect( state.control.kind ).toBe( 'none' );
			expect( getFeatureUnavailableReason( state ) ).toBe( 'Unavailable in Offline mode' );
			expect( getForcedReason( state ) ).toBe( reason );
		}
	);

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

	it.each( [
		[ 'active', 'not-installed', 'install-plugin' ],
		[ 'inactive', 'not-installed', 'install-plugin' ],
		[ 'active', 'inactive', 'plugin' ],
		[ 'inactive', 'inactive', 'plugin' ],
	] as const )(
		'keeps the module limitation separate for override %s and plugin %s',
		( override, plugin_status, kind ) => {
			const state = resolveFeatureState(
				{ ...protect, module: 'protect-dashboard', plugin_status },
				'active',
				undefined,
				{
					'protect-dashboard': buildModule( {
						module: 'protect-dashboard',
						override,
						available: false,
						unavailable_reason: 'Unavailable in Offline mode',
					} ),
				},
				{}
			);
			expect( state.control.kind ).toBe( kind );
			expect( state.moduleUnavailableReason ).toBe( 'Unavailable in Offline mode' );
			expect( getForcedReason( state ) ).toBeNull();
		}
	);

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

describe( 'resolveFeatureState, for a module the plan does not cover', () => {
	// Search ships in Jetpack and as a plugin, and is unavailable without a Search plan.
	const search = buildFeature( {
		slug: 'search',
		in_jetpack: true,
		product: 'search',
		plugin: 'jetpack-search',
	} );

	const forcedOff = {
		search: buildModule( {
			module: 'search',
			available: false,
			activated: false,
			override: 'inactive',
		} ),
	};

	it.each( [ 'not-installed', 'inactive', 'active' ] as const )(
		'explains a host override instead of offering a %s plugin',
		plugin_status => {
			const state = resolve(
				{ ...search, plugin_status, plugin_override: plugin_status === 'active' ? 'active' : '' },
				'active',
				forcedOff
			);

			expect( state.control ).toEqual( { kind: 'module', module: forcedOff.search } );
			expect( state.status ).toBe( 'inactive' );
			expect( getForcedReason( state ) ).toBe( 'Disabled by your host or site administrator' );
		}
	);

	it( 'still offers the plugin when nothing forced the module', () => {
		const unforced = {
			search: buildModule( { module: 'search', available: false, activated: false } ),
		};

		const state = resolve( search, 'active', unforced );
		expect( state.control ).toEqual( { kind: 'install-plugin', plugin: 'jetpack-search' } );
		expect( state.moduleUnavailableReason ).toBe( 'Unavailable' );
		expect( getForcedReason( state ) ).toBeNull();
	} );
} );

describe( 'resolveFeatureState, for a feature a plan runs without its plugin', () => {
	const backup = buildFeature( {
		slug: 'backup',
		in_jetpack: true,
		module: 'backup',
		manage_url: '/backup',
		plugin: 'jetpack-backup',
		plugin_status: 'not-installed',
		product: 'backup',
	} );

	const withProduct = ( product: ProductCamelCase ) =>
		resolveFeatureState(
			backup,
			'active',
			product,
			{ backup: buildModule( { module: 'backup', available: false } ) },
			{}
		);

	it( 'is active and opens in place of Install when a paid plan runs it', () => {
		const state = withProduct( {
			hasPaidPlanForProduct: true,
			status: PRODUCT_STATUSES.ACTIVE,
		} as ProductCamelCase );

		expect( state.status ).toBe( 'active' );
		expect( getFeatureManageUrl( state ) ).toBe( '/backup' );
		expect( state.control ).toEqual( {
			kind: 'install-plugin',
			plugin: 'jetpack-backup',
			runsWithoutPlugin: true,
		} );
	} );

	it.each( [
		PRODUCT_STATUSES.NEEDS_ATTENTION__WARNING,
		PRODUCT_STATUSES.NEEDS_ATTENTION__ERROR,
		PRODUCT_STATUSES.EXPIRING_SOON,
	] )( 'stays active and opens while the plan reports %s', status => {
		const state = withProduct( { hasPaidPlanForProduct: true, status } as ProductCamelCase );

		expect( state.status ).toBe( 'active' );
		expect( state.control ).toEqual( {
			kind: 'install-plugin',
			plugin: 'jetpack-backup',
			runsWithoutPlugin: true,
		} );
	} );

	it( 'offers Install again once the plan has expired', () => {
		const state = withProduct( {
			hasPaidPlanForProduct: true,
			status: PRODUCT_STATUSES.EXPIRED,
		} as ProductCamelCase );

		expect( state.status ).toBe( 'inactive' );
		expect( state.control ).toEqual( { kind: 'install-plugin', plugin: 'jetpack-backup' } );
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

it( 'keeps offline management links only for pages registered on this site', () => {
	const previousInitial = window.myJetpackInitialState;
	const previousData = window.JetpackScriptData;
	const registeredPages = [ 'jetpack-forms' ];
	const menu = document.createElement( 'ul' );
	menu.id = 'adminmenu';
	document.body.appendChild( menu );
	window.myJetpackInitialState = { isOfflineFeatures: true } as typeof previousInitial;
	window.JetpackScriptData = {
		myJetpack: {
			offlineFeatures: { mainFeatures: { available_admin_pages: registeredPages } },
		},
	} as unknown as typeof previousData;
	try {
		const state = resolve(
			buildFeature( {
				plugin: 'jetpack-stats',
				plugin_status: 'active',
				manage_url: 'https://example.com/wp-admin/admin.php?page=stats',
			} ),
			'active'
		);
		expect( getFeatureManageUrl( state ) ).toBe( '' );
		state.feature.manage_url = 'https://example.com/wp-admin/admin.php?page=jetpack-forms';
		expect( getFeatureManageUrl( state ) ).toBe( state.feature.manage_url );
		registeredPages.length = 0;
		menu.innerHTML = `<li><a href="${ state.feature.manage_url }">Forms</a></li>`;
		state.feature.manage_url += '#/responses';
		expect( getFeatureManageUrl( state ) ).toBe( state.feature.manage_url );
	} finally {
		menu.remove();
		window.myJetpackInitialState = previousInitial;
		window.JetpackScriptData = previousData;
	}
} );

describe( 'account-dependent features', () => {
	it.each( [
		[ 'activity-log', 'activity-log', '' ],
		[ 'jetpack-ai', 'ai', 'jetpack-ai' ],
		[ 'newsletter', 'subscriptions', 'newsletter' ],
		[ 'monitor', 'monitor', '' ],
		[ 'notes', 'notes', '' ],
		[ 'post-by-email', 'post-by-email', '' ],
		[ 'sso', 'sso', '' ],
	] )( 'offers connection for %s, including gated AI', ( slug, module, product ) => {
		const state = resolveFeatureState(
			buildFeature( {
				slug,
				product,
				in_jetpack: true,
				module: product === 'jetpack-ai' ? '' : module,
			} ),
			'active',
			undefined,
			{ [ module ]: buildModule( { module, requires_user_connection: true, available: false } ) },
			{},
			false,
			true
		);
		expect( state.control.kind ).toBe( 'connect-account' );
		expect( state.status ).toBe( 'inactive' );
		expect( isFeatureAvailable( state ) ).toBe( false );
		expect( getFeatureManageUrl( state ) ).toBe( '' );
	} );

	it.each( [
		[ 'social', 'not-installed' ],
		[ 'social', 'inactive' ],
		[ 'social', 'active' ],
		[ 'backup', 'not-installed' ],
		[ 'backup', 'inactive' ],
		[ 'backup', 'active' ],
	] as const )( 'requires an account for %s with its plugin %s', ( product, plugin_status ) => {
		const state = resolveFeatureState(
			buildFeature( { product, plugin: `jetpack-${ product }`, plugin_status } ),
			'not-installed',
			{ status: PRODUCT_STATUSES.ACTIVE, hasPaidPlanForProduct: true } as ProductCamelCase,
			{},
			{},
			false,
			true
		);
		expect( state.control.kind ).toBe( 'connect-account' );
		expect( state.status ).toBe( 'inactive' );
		expect( isFeatureAvailable( state ) ).toBe( false );
	} );

	it.each( [
		[ 'plugin forced off', 'publicize', 'social', 'inactive', false, false, 'plugin' ],
		[ 'plugin forced on', 'publicize', 'social', 'active', false, false, 'connect-account' ],
		[ 'module forced on', 'publicize', 'social', '', 'active', false, 'connect-account' ],
		[ 'multisite', 'backup', 'backup', '', false, true, 'module' ],
		[ 'module forced on, multisite', 'backup', 'backup', '', 'active', true, 'module' ],
	] as const )(
		'handles account connection with %s',
		( _name, module, product, plugin_override, override, is_multisite, kind ) => {
			const previousData = window.JetpackScriptData;
			window.JetpackScriptData = {
				...previousData,
				site: { ...previousData?.site, is_multisite },
			};
			try {
				const accountModule = buildModule( {
					module,
					requires_user_connection: true,
					override,
				} );
				const state = resolveFeatureState(
					buildFeature( {
						module,
						product,
						in_jetpack: ! plugin_override,
						plugin: `jetpack-${ product }`,
						plugin_status: plugin_override === 'inactive' ? 'inactive' : 'active',
						plugin_override,
					} ),
					'active',
					undefined,
					{ [ module ]: accountModule },
					PRODUCT_MODULES,
					false,
					true
				);
				expect( state.control.kind ).toBe( kind );
				expect( getModuleFeatureState( accountModule, {}, true ).control.kind ).toBe(
					plugin_override ? 'connect-account' : kind
				);
			} finally {
				window.JetpackScriptData = previousData;
			}
		}
	);
} );

it.each( [ [ 'publicize', 'social' ] ] )(
	'keeps a host-forced-off %s blocked before asking for an account',
	( module, product ) => {
		const blocked = buildModule( {
			module,
			activated: false,
			available: false,
			requires_user_connection: true,
			override: 'inactive',
		} );
		const state = resolveFeatureState(
			buildFeature( {
				module,
				product,
				in_jetpack: true,
				plugin: 'jetpack-social',
				plugin_status: 'active',
			} ),
			'active',
			undefined,
			{ [ module ]: blocked },
			PRODUCT_MODULES,
			false,
			true
		);
		expect( state.control.kind ).toBe( 'module' );
		expect( getForcedReason( state ) ).toBe( 'Disabled by your host or site administrator' );
		expect( getModuleFeatureState( blocked, {}, true ).control.kind ).toBe( 'module' );
	}
);
