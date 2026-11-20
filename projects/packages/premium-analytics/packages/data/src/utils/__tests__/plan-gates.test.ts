/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import {
	getLockedFeature,
	getLockedSection,
	getLockedWidgetFeature,
	isStatsFeatureLocked,
} from '../plan-gates';

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
	locked_widget_types: { 'jpa/utm-insights': 'utm', 'videopress/top-videos': 'videos' },
	locked_sections: {
		insights: {
			title: 'Unlock site insights',
			description: 'Get detailed insights into your site’s performance with a Personal plan.',
			features: [ 'Monitor your posting activity' ],
			upgrade_label: 'Upgrade to Personal',
			expand_label: 'Show all Personal features',
			support_url: 'https://wordpress.com/support/stats/',
			upgrade_url: 'https://wordpress.com/checkout/example.com/personal',
		},
	},
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
		expect( getLockedWidgetFeature( 'videopress/top-videos' ) ).toBe( 'videos' );
		expect( getLockedWidgetFeature( 'jpa/referrers' ) ).toBeUndefined();
		expect( getLockedSection( 'insights' ) ).toBe( gates.locked_sections.insights );
		expect( getLockedSection( 'subscribers' ) ).toBeUndefined();
	} );

	it.each( [
		[ 'no script data', undefined ],
		[ 'an older server without gates', { premium_analytics: {} } ],
	] )( 'locks nothing with %s', ( _, data ) => {
		( getScriptData as jest.Mock ).mockReturnValue( data );

		expect( isStatsFeatureLocked( 'utm' ) ).toBe( false );
		expect( getLockedWidgetFeature( 'jpa/utm-insights' ) ).toBeUndefined();
		expect( getLockedSection( 'insights' ) ).toBeUndefined();
	} );

	it( 'locks no section on a server that predates section gates', () => {
		( getScriptData as jest.Mock ).mockReturnValue( {
			premium_analytics: { plan_gates: { ...gates, locked_sections: undefined } },
		} );

		expect( getLockedSection( 'insights' ) ).toBeUndefined();
	} );

	it( 'does not read inherited names as locked', () => {
		expect( getLockedWidgetFeature( 'constructor' ) ).toBeUndefined();
		expect( getLockedSection( 'constructor' ) ).toBeUndefined();
	} );
} );
