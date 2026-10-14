/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { getLockedWidgetFeature, getStatsUpgradeUrl, isStatsFeatureLocked } from '../plan-gates';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const gates = {
	tier: 'paid',
	locked_features: { utm: 'https://wordpress.com/checkout/example.com/premium', devices: '' },
	locked_widget_types: { 'jpa/utm-insights': 'utm', 'plugin/top-videos': 'plugin-feature' },
};

describe( 'plan gates', () => {
	beforeEach( () => {
		( getScriptData as jest.Mock ).mockReturnValue( { premium_analytics: { plan_gates: gates } } );
	} );

	it( 'reads the locked features, their upgrade URLs and the locked widget types', () => {
		expect( isStatsFeatureLocked( 'utm' ) ).toBe( true );
		expect( isStatsFeatureLocked( 'referrers' ) ).toBe( false );
		expect( getStatsUpgradeUrl( 'utm' ) ).toBe( gates.locked_features.utm );
		expect( getLockedWidgetFeature( 'jpa/utm-insights' ) ).toBe( 'utm' );
		expect( getLockedWidgetFeature( 'plugin/top-videos' ) ).toBe( 'plugin-feature' );
		expect( getLockedWidgetFeature( 'jpa/referrers' ) ).toBeUndefined();
	} );

	it( 'keeps a feature locked but offers no upgrade where there is nowhere to buy it', () => {
		expect( isStatsFeatureLocked( 'devices' ) ).toBe( true );
		expect( getStatsUpgradeUrl( 'devices' ) ).toBeUndefined();
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
		expect( getStatsUpgradeUrl( 'toString' ) ).toBeUndefined();
	} );
} );
