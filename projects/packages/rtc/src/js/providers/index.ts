import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './pinghub';

addFilter( 'sync.providers', 'jetpack/rtc-providers', () => {
	if ( ! window.jetpackRTC?.providers ) {
		return [];
	}
	const jetpackRTCProviders = [];
	window.jetpackRTC.providers.forEach( ( provider: string ) => {
		if ( provider === 'pinghub' ) {
			jetpackRTCProviders.push( createPingHubProvider() );
		}
	} );
	return jetpackRTCProviders;
} );
