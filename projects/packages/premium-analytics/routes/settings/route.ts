/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

/**
 * Route guard for /settings: connected sites, and the users the site hands its Stats settings to.
 */
export const route = {
	beforeLoad: () => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		// Present only for users who can manage the settings, on sites where the dashboard owns them.
		if ( ! getScriptData()?.premium_analytics?.stats_settings ) {
			throw redirect( { to: '/' } );
		}

		// The form mounts once the plan usage hold lifts, so its request starts here. It reports a failed load itself.
		void ensureCoreSettingsReady().catch( () => undefined );
	},
};
