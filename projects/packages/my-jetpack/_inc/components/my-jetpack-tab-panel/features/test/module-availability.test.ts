import { getScriptData } from '@automattic/jetpack-script-data';
import { getModuleStatus, isFeatureAvailable } from '../module-availability';
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

describe( 'isFeatureAvailable', () => {
	afterEach( () => {
		window.myJetpackInitialState.myJetpackFlags =
			{} as typeof window.myJetpackInitialState.myJetpackFlags;
	} );

	it.each( [
		[ false, true ],
		[ true, false ],
	] )(
		'with the account-connect flag on: %s, counts a blocked plugin install as Available: %s',
		( accountConnect, available ) => {
			window.myJetpackInitialState.myJetpackFlags = {
				accountConnect,
			} as typeof window.myJetpackInitialState.myJetpackFlags;
			const state = {
				feature: { slug: 'boost', name: 'Boost', plugin: 'jetpack-boost' },
				status: 'inactive',
				control: { kind: 'install-plugin', plugin: 'jetpack-boost', blocked: 'not_permitted' },
			} as FeatureState;

			expect( isFeatureAvailable( state ) ).toBe( available );
		}
	);
} );
