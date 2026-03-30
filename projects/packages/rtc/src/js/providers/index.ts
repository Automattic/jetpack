import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './pinghub';

/**
 * Register providers (e.g. PingHub) supplied by the server alongside the existing HTTP-polling provider.
 */
function jetpackRegisterRTCProviders() {
	const getProviders = () => {
		if ( ! window.jetpackRTC?.providers ) {
			return [];
		}

		return window.jetpackRTC.providers
			.map( ( provider: string ) => {
				switch ( provider ) {
					case 'pinghub': {
						return createPingHubProvider();
					}
					default:
						return null;
				}
			} )
			.filter( Boolean );
	};

	addFilter( 'sync.providers', 'jetpack/rtc-providers', ( existing: unknown[] ) => {
		const ours = getProviders();
		// Empty means the site is not eligible for RTC — disable it entirely.
		if ( ours.length === 0 ) {
			return [];
		}
		return [ ...existing, ...ours ];
	} );
}

jetpackRegisterRTCProviders();
