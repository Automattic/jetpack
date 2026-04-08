import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './pinghub';

/**
 * Register providers (e.g. PingHub) supplied by the server, and disable HTTP polling by returning only this provider.
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

	addFilter( 'sync.providers', 'jetpack/rtc-providers', () => getProviders() );
}

jetpackRegisterRTCProviders();
