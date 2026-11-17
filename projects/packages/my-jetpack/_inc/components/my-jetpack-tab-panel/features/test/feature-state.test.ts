import { PRODUCT_STATUSES } from '../../../../constants';
import {
	getFeatureManageUrl,
	getForcedReason,
	offersConnect,
	resolveFeatureState,
} from '../feature-state';
import { PRODUCT_MODULES } from '../mappings';
import { getFeatureUnavailableReason, isFeatureAvailable } from '../module-availability';
import { matchesFilter } from '../use-feature-filter';
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

	it.each( [
		[ 'offers Connect when the account is all AI lacks', true, true, false, 'module', true ],
		[ 'offers no Connect when AI lacks more than the account', false, true, false, 'none', false ],
		[ 'offers no Connect when the account is not missing', true, false, false, 'none', false ],
		[ 'offers no Connect when a host forces AI off', true, true, 'inactive', 'none', false ],
	] as const )( 'gated AI %s', ( _, waitingForAccount, needsAccount, override, kind, connect ) => {
		const previousInitial = window.myJetpackInitialState;
		window.myJetpackInitialState = {
			myJetpackFlags: { showAiModuleToggleOnceConnected: waitingForAccount },
		} as unknown as typeof previousInitial;
		try {
			const modules = {
				ai: buildModule( {
					module: 'ai',
					requires_user_connection: true,
					available: false,
					unavailable_reason: 'Requires a connected WordPress.com account',
					override,
				} ),
			};
			const state = resolveFeatureState(
				{ ...ai, needs_account: true },
				'active',
				undefined,
				modules,
				gated,
				false,
				needsAccount
			);
			expect( state.control.kind ).toBe( kind );
			expect( offersConnect( state ) ).toBe( connect );
		} finally {
			window.myJetpackInitialState = previousInitial;
		}
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

describe( 'resolveFeatureState, for a feature its plan decides', () => {
	const backup = buildFeature( {
		slug: 'backup',
		in_jetpack: true,
		product: 'backup',
		plugin: 'jetpack-backup',
		plan_driven: true,
	} );
	const modules = {
		backup: buildModule( { module: 'backup', activated: true } ),
	};

	it.each( [
		[ PRODUCT_STATUSES.ACTIVE, true, 'active', 'Included in your plan' ],
		[ PRODUCT_STATUSES.EXPIRING_SOON, true, 'active', 'Included in your plan' ],
		[ PRODUCT_STATUSES.EXPIRED, true, 'inactive', 'Your plan expired' ],
		[ PRODUCT_STATUSES.NEEDS_PLAN, false, 'inactive', null ],
	] )(
		'reads its state from the plan and offers no switch: %s',
		( productStatus, hasPaidPlanForProduct, status, reason ) => {
			const state = resolveFeatureState(
				backup,
				'active',
				{ status: productStatus, hasPaidPlanForProduct } as ProductCamelCase,
				modules,
				{}
			);

			expect( state.status ).toBe( status );
			expect( getForcedReason( state ) ).toBe( reason );
			expect( state.control.kind ).toBe( 'plan' );
		}
	);

	it.each( [
		[ 'Jetpack', 'active', 'not-installed', '', modules, { kind: 'plan' } ],
		[ 'the standalone plugin', 'not-installed', 'active', '', {}, { kind: 'plan' } ],
		[
			'the standalone plugin, installed but off',
			'not-installed',
			'inactive',
			'',
			{},
			{ kind: 'plan', activatePlugin: 'jetpack-backup' },
		],
		[ 'neither', 'not-installed', 'not-installed', '', {}, { kind: 'install-plugin' } ],
		[
			'a plugin a host forced off',
			'not-installed',
			'inactive',
			'inactive',
			{},
			{ kind: 'plugin', override: 'inactive' },
		],
		[
			'Jetpack, with the module switched off',
			'active',
			'not-installed',
			'',
			{ backup: buildModule( { module: 'backup', activated: false } ) },
			{ kind: 'plan' },
		],
		[
			'Jetpack, with a host forcing the module off',
			'active',
			'not-installed',
			'',
			{ backup: buildModule( { module: 'backup', activated: false, override: 'inactive' } ) },
			{ kind: 'plan' },
		],
	] as const )(
		'follows the plan when %s delivers it',
		( _case, jetpack, pluginStatus, pluginOverride, siteModules, control ) => {
			const state = resolveFeatureState(
				{ ...backup, plugin_status: pluginStatus, plugin_override: pluginOverride },
				jetpack,
				{ status: PRODUCT_STATUSES.ACTIVE, hasPaidPlanForProduct: true } as ProductCamelCase,
				siteModules,
				{}
			);

			expect( state.control ).toEqual( expect.objectContaining( control ) );
			expect( 'activatePlugin' in state.control ).toBe( 'activatePlugin' in control );
		}
	);

	it( 'explains a plan that is paid for but not running, which has no Upgrade to offer', () => {
		const state = resolveFeatureState(
			{ ...backup, included: true },
			'active',
			{ status: PRODUCT_STATUSES.INACTIVE, hasPaidPlanForProduct: true } as ProductCamelCase,
			modules,
			{}
		);

		expect( state.status ).toBe( 'inactive' );
		expect( getForcedReason( state ) ).toBe( 'Included in your plan, but not running' );
	} );

	it( 'waits for the product before saying whether the plan runs it', () => {
		expect( resolveFeatureState( backup, 'active', undefined, modules, {} ).pending ).toBe( true );
	} );

	it( 'leaves the standalone plugin its switch in offline Features mode, which loads no products', () => {
		const previousInitial = window.myJetpackInitialState;
		window.myJetpackInitialState = { isOfflineFeatures: true } as typeof previousInitial;
		try {
			const state = resolveFeatureState(
				{ ...backup, plugin_status: 'active', plugin_override: '' },
				'not-installed',
				undefined,
				{},
				{}
			);

			expect( state.pending ).toBeFalsy();
			expect( state.control.kind ).toBe( 'plugin' );
		} finally {
			window.myJetpackInitialState = previousInitial;
		}
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
		[ 'activity-log', 'activity-log', '', {}, 'module' ],
		[ 'jetpack-ai', 'ai', 'jetpack-ai', {}, 'none' ],
		[ 'jetpack-ai', 'ai', 'jetpack-ai', PRODUCT_MODULES, 'module' ],
		[ 'newsletter', 'subscriptions', 'newsletter', {}, 'module' ],
	] )(
		'marks %s (module %s) as waiting for an account, out of Active and Available, with no manage link',
		( slug, module, product, productModules, kind ) => {
			const state = resolveFeatureState(
				buildFeature( {
					slug,
					product,
					in_jetpack: true,
					module: product === 'jetpack-ai' ? '' : module,
					manage_url: '/wp-admin/admin.php?page=manage',
				} ),
				'active',
				undefined,
				{
					[ module ]: buildModule( {
						module,
						requires_user_connection: true,
						available: false,
						unavailable_reason: 'Requires a connected WordPress.com account',
					} ),
				},
				productModules,
				false,
				true
			);
			expect( state.control.kind ).toBe( kind );
			expect( state.accountNeeded ).toBe( true );
			expect( state.status ).toBe( kind === 'module' ? 'active' : 'inactive' );
			expect( getForcedReason( state ) ).toBeNull();
			expect( isFeatureAvailable( state ) ).toBe( false );
			expect( matchesFilter( state, 'active' ) ).toBe( false );
			expect( matchesFilter( state, 'inactive' ) ).toBe( true );
			expect( getFeatureManageUrl( state ) ).toBe( '' );
		}
	);

	it.each( [
		[ 'social', 'not-installed', 'install-plugin' ],
		[ 'social', 'inactive', 'plugin' ],
		[ 'social', 'active', 'plugin' ],
		[ 'backup', 'not-installed', 'install-plugin' ],
	] as const )(
		'keeps %s on its plugin %s, with its saved state, until the account connects',
		( product, plugin_status, kind ) => {
			const state = resolveFeatureState(
				buildFeature( { product, plugin: `jetpack-${ product }`, plugin_status } ),
				'active',
				{ status: PRODUCT_STATUSES.ACTIVE, hasPaidPlanForProduct: true } as ProductCamelCase,
				{
					[ PRODUCT_MODULES[ product ] ?? product ]: buildModule( {
						module: PRODUCT_MODULES[ product ] ?? product,
						requires_user_connection: true,
						available: false,
						unavailable_reason: 'Requires a connected WordPress.com account',
					} ),
				},
				PRODUCT_MODULES,
				false,
				true
			);
			expect( state.control.kind ).toBe( kind );
			expect( state.accountNeeded ).toBe( true );
			expect( state.status ).toBe( plugin_status === 'inactive' ? 'inactive' : 'active' );
			expect( state.moduleUnavailableReason ).toBeUndefined();
			expect( isFeatureAvailable( state ) ).toBe( false );
			expect( matchesFilter( state, 'active' ) ).toBe( false );
		}
	);

	it.each( [
		[ 'plugin forced off', 'publicize', 'social', 'inactive', false, false, false, true ],
		[ 'plugin forced on', 'publicize', 'social', 'active', false, false, true, true ],
		[ 'module forced on', 'publicize', 'social', '', 'active', false, true, true ],
		[ 'module forced off', 'publicize', 'social', '', 'inactive', false, false, false ],
		[ 'multisite', 'backup', 'backup', '', false, true, false, false ],
		[ 'module forced on, multisite', 'backup', 'backup', '', 'active', true, false, false ],
	] as const )(
		'decides whether an account is waited for with %s',
		(
			_name,
			module,
			product,
			plugin_override,
			override,
			is_multisite,
			accountNeeded,
			moduleAccountNeeded
		) => {
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
					...( override === 'inactive' ? { activated: false, available: false } : {} ),
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
				expect( Boolean( state.accountNeeded ) ).toBe( accountNeeded );
				expect( Boolean( getModuleFeatureState( accountModule, {}, true ).accountNeeded ) ).toBe(
					moduleAccountNeeded
				);
			} finally {
				window.JetpackScriptData = previousData;
			}
		}
	);
} );

describe( 'account-dependent features without an active Jetpack', () => {
	const activityLog = buildFeature( {
		slug: 'activity-log',
		in_jetpack: true,
		module: 'activity-log',
		plugin: '',
		needs_account: true,
	} );
	const search = buildFeature( {
		slug: 'search',
		in_jetpack: true,
		module: 'search',
		product: 'search',
		plugin: '',
	} );

	it.each( [
		[ 'Activity Log', 'not-installed', activityLog, true ],
		[ 'Search', 'not-installed', search, undefined ],
	] as const )(
		'reads whether %s waits for an account from the catalog with Jetpack %s',
		( _name, jetpack, feature, accountNeeded ) => {
			const state = resolveFeatureState( feature, jetpack, undefined, undefined, {}, false, true );

			expect( state.control.kind ).toBe( 'install-jetpack' );
			expect( state.accountNeeded ).toBe( accountNeeded );
		}
	);
} );
