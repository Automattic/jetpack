import { getScriptData } from '@automattic/jetpack-script-data';
import { getFeatureStatusLabel, getModuleStatus, isFeatureAvailable } from '../module-availability';
import type { MyJetpackModule } from '../../../../types';
import type { FeatureState } from '../feature-state';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

const buildModule = ( overrides: Partial< MyJetpackModule > = {} ): MyJetpackModule => ( {
	available: true,
	module: 'activity-log',
	name: 'Activity Log',
	activated: true,
	override: false,
	description: '',
	long_description: '',
	search_terms: '',
	...overrides,
} );

describe( 'getModuleStatus', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { site: { is_multisite: false } } );
	} );

	it( 'leaves a module nobody forced actionable', () => {
		expect( getModuleStatus( buildModule() ) ).toEqual( { isAvailable: true } );
	} );

	it( 'takes the control away from a module forced on', () => {
		expect( getModuleStatus( buildModule( { override: 'active' } ) ) ).toEqual( {
			isAvailable: false,
			reason: 'Enabled by your host or site administrator',
		} );
	} );

	it( 'takes the control away from a module forced off', () => {
		expect( getModuleStatus( buildModule( { activated: false, override: 'inactive' } ) ) ).toEqual(
			{
				isAvailable: false,
				reason: 'Disabled by your host or site administrator',
			}
		);
	} );
} );

describe( 'getFeatureStatusLabel', () => {
	const feature = { slug: 'stats', name: 'Stats', plugin: '' } as MainFeature;
	const build = ( control: FeatureState[ 'control' ], overrides: Partial< FeatureState > = {} ) =>
		( { feature, status: 'active', control, ...overrides } ) as FeatureState;
	const plugin = { ...feature, plugin: 'jetpack-boost', plugin_status: 'not-installed' };

	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { site: { is_multisite: false } } );
	} );

	afterEach( () => {
		window.myJetpackInitialState.myJetpackFlags = undefined;
	} );

	it.each( [
		[ 'a module switched on', 'Active', null, build( { kind: 'module', module: buildModule() } ) ],
		[
			'a module that cannot run here',
			'Unavailable',
			'Unavailable',
			build( { kind: 'module', module: buildModule( { available: false } ) } ),
		],
		[
			'a missing plugin',
			'Inactive',
			null,
			build(
				{ kind: 'install-plugin', plugin: 'jetpack-boost' },
				{ status: 'inactive', feature: plugin as MainFeature }
			),
		],
		[
			'a feature waiting for Jetpack',
			'Inactive',
			null,
			build( { kind: 'install-jetpack', installed: false }, { status: 'inactive' } ),
		],
		[
			'a feature with no control',
			'Inactive',
			'Inactive',
			build( { kind: 'none' }, { status: 'inactive' } ),
		],
		[
			'a feature waiting for an account',
			null,
			null,
			build( { kind: 'none' }, { accountNeeded: true } ),
		],
		[
			'a feature still loading',
			'Inactive',
			null,
			build( { kind: 'none' }, { pending: true, status: 'inactive' } ),
		],
	] )( 'labels %s %s with the flag off and %s with it on', ( _, flagOff, flagOn, state ) => {
		expect( getFeatureStatusLabel( state ) ).toBe( flagOff );
		window.myJetpackInitialState.myJetpackFlags = {
			accountConnect: true,
		} as typeof window.myJetpackInitialState.myJetpackFlags;
		expect( getFeatureStatusLabel( state ) ).toBe( flagOn );
	} );
} );

describe( 'isFeatureAvailable', () => {
	afterEach( () => {
		window.myJetpackInitialState.myJetpackFlags =
			{} as typeof window.myJetpackInitialState.myJetpackFlags;
	} );

	const blockedPlugin = {
		kind: 'install-plugin',
		plugin: 'jetpack-boost',
		blocked: 'not_permitted',
	};
	const blockedJetpack = { kind: 'install-jetpack', installed: false, blocked: 'not_permitted' };

	it.each( [
		[ 'off', 'plugin install', true, blockedPlugin ],
		[ 'off', 'Jetpack install', true, blockedJetpack ],
		[ 'on', 'plugin install', false, blockedPlugin ],
	] as const )(
		'with the account-connect flag %s, lists a blocked %s in Available: %s',
		( flag, _, available, control ) => {
			window.myJetpackInitialState.myJetpackFlags = {
				accountConnect: flag === 'on',
			} as typeof window.myJetpackInitialState.myJetpackFlags;
			const state = {
				feature: { slug: 'boost', name: 'Boost', plugin: 'jetpack-boost' },
				status: 'inactive',
				control,
			} as FeatureState;

			expect( isFeatureAvailable( state ) ).toBe( available );
		}
	);
} );
