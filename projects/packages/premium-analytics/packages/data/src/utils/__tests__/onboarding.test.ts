/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '../../defaults/remembered-preset';
import {
	DASHBOARD_ONBOARDING_KEY,
	DASHBOARD_STORE_ONBOARDING_KEY,
	isOnboardingPending,
} from '../onboarding';

const SEEN = '2026-11-01T00:00:00.000Z';

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | undefined ) => unknown;
};

function setSeen( key: string, value: string | undefined ) {
	void ( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		key,
		value
	);
}

function setSections( sections: string[] | undefined ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { sections } },
	} );
}

afterEach( () => {
	setSeen( DASHBOARD_ONBOARDING_KEY, undefined );
	setSeen( DASHBOARD_STORE_ONBOARDING_KEY, undefined );
	delete window.JetpackScriptData;
} );

describe( 'isOnboardingPending', () => {
	it.each< [ string, string | undefined, string | undefined, string[] | undefined, boolean ] >( [
		[ 'a reader who has seen nothing', undefined, undefined, [ 'traffic' ], true ],
		[
			'a reader who knows Stats, without the WooCommerce tab',
			SEEN,
			undefined,
			[ 'traffic' ],
			false,
		],
		[
			'a reader who knows Stats, with a WooCommerce tab still to meet',
			SEEN,
			undefined,
			[ 'traffic', 'woocommerce' ],
			true,
		],
		[ 'the same reader under the older `store` slug', SEEN, undefined, [ 'store' ], true ],
		[ 'a reader who has been through both', SEEN, SEEN, [ 'traffic', 'woocommerce' ], false ],
		[
			'a reader who knows Stats, when no list of tabs was published',
			SEEN,
			undefined,
			undefined,
			false,
		],
	] )( 'answers for %s', ( _case, statsSeen, storeSeen, sections, expected ) => {
		setSeen( DASHBOARD_ONBOARDING_KEY, statsSeen );
		setSeen( DASHBOARD_STORE_ONBOARDING_KEY, storeSeen );
		setSections( sections );

		expect( isOnboardingPending() ).toBe( expected );
	} );
} );
