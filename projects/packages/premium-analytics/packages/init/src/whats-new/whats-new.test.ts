/**
 * External dependencies
 */
import { mountWhatsNew } from '@automattic/jetpack-announcements';
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { showWhatsNew } from './whats-new';

jest.mock( '@automattic/jetpack-announcements', () => ( {
	mountWhatsNew: jest.fn(),
} ) );

const SEEN = '2026-11-01T00:00:00.000Z';

type PreferencesActions = {
	set: ( scope: string, key: string, value: string | undefined ) => unknown;
};

const setPreference = ( key: string, value: string | undefined ): void => {
	void ( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
		DASHBOARD_PREFERENCES_SCOPE,
		key,
		value
	);
};

const setScriptData = ( premiumAnalytics: Record< string, unknown > ): void => {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: premiumAnalytics },
	} );
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

afterEach( () => {
	setPreference( 'onboardingCompletedAt', undefined );
	setPreference( 'storeOnboardingCompletedAt', undefined );
	delete window.JetpackScriptData;
	jest.mocked( mountWhatsNew ).mockClear();
} );

describe( 'showWhatsNew', () => {
	it.each< [ string, string | undefined, string | undefined, string[] | undefined, number ] >( [
		[ 'holds for a reader who has seen nothing', undefined, undefined, [ 'traffic' ], 0 ],
		[ 'mounts for a reader who knows Stats', SEEN, undefined, [ 'traffic' ], 1 ],
		[
			'holds while the WooCommerce tab is still to be introduced',
			SEEN,
			undefined,
			[ 'traffic', 'woocommerce' ],
			0,
		],
		[ 'holds for that tab under its older `store` slug', SEEN, undefined, [ 'store' ], 0 ],
		[ 'mounts once both journeys are done', SEEN, SEEN, [ 'traffic', 'woocommerce' ], 1 ],
		[ 'mounts when no list of tabs was published', SEEN, undefined, undefined, 1 ],
	] )( '%s', async ( _case, statsSeen, storeSeen, sections, mounts ) => {
		setPreference( 'onboardingCompletedAt', statsSeen );
		setPreference( 'storeOnboardingCompletedAt', storeSeen );
		setScriptData( { whats_new_enabled: true, sections } );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( mounts );
	} );

	it( 'mounts nothing while the flag is off', async () => {
		setPreference( 'onboardingCompletedAt', SEEN );
		setScriptData( { whats_new_enabled: false, sections: [ 'traffic' ] } );

		await showAndSettle();

		expect( mountWhatsNew ).not.toHaveBeenCalled();
	} );
} );
