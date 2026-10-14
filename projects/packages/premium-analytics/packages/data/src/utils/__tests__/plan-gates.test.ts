/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getLockedFeature, getLockedWidgetFeature, isStatsFeatureLocked } from '../plan-gates';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const gates = {
	tier: 'paid',
	locked_features: {
		utm: {
			description: 'Track your <link>campaign performance data</link>.',
			support_url: 'https://jetpack.com/support/',
			upgrade_url: 'https://wordpress.com/checkout/example.com/premium',
		},
	},
	locked_widget_types: { 'jpa/utm-insights': 'utm', 'plugin/top-videos': 'plugin-feature' },
};

describe( 'plan gates', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { premium_analytics: { plan_gates: gates } } );
	} );

	it( 'reads the locked features and the locked widget types', () => {
		expect( isStatsFeatureLocked( 'utm' ) ).toBe( true );
		expect( isStatsFeatureLocked( 'referrers' ) ).toBe( false );
		expect( getLockedFeature( 'utm' ) ).toBe( gates.locked_features.utm );
		expect( getLockedFeature( 'referrers' ) ).toBeUndefined();
		expect( getLockedWidgetFeature( 'jpa/utm-insights' ) ).toBe( 'utm' );
		expect( getLockedWidgetFeature( 'plugin/top-videos' ) ).toBe( 'plugin-feature' );
		expect( getLockedWidgetFeature( 'jpa/referrers' ) ).toBeUndefined();
	} );

	it.each( [
		[ 'no script data', undefined ],
		[ 'an older server without gates', { premium_analytics: {} } ],
	] )( 'locks nothing with %s', ( _, data ) => {
		( getScriptData as jest.Mock ).mockReturnValue( data );

		expect( isStatsFeatureLocked( 'utm' ) ).toBe( false );
		expect( getLockedWidgetFeature( 'jpa/utm-insights' ) ).toBeUndefined();
	} );

	it( 'does not read inherited names as locked', () => {
		expect( getLockedWidgetFeature( 'constructor' ) ).toBeUndefined();
		expect( getLockedFeature( 'toString' ) ).toBeUndefined();
	} );
} );
