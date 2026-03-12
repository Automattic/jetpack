import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './providers/pinghub';
import { withRoomLimit } from './room-limit';
import type { ProviderCreator } from '@wordpress/sync';

/**
 * Register providers (e.g. PingHub, HTTP polling) supplied by the server,
 * each wrapped with a room-user-limit enforcer.
 */
function registerWpcomGutenbergProviders() {
	const getProviders = ( defaultProviders: unknown[] ) => {
		if ( ! window.wpcomGutenbergRTC?.providers ) {
			return defaultProviders;
		}

		const httpPollingCreator =
			typeof defaultProviders?.[ 0 ] === 'function'
				? ( defaultProviders[ 0 ] as ProviderCreator )
				: null;

		const roomUserLimit = window.wpcomGutenbergRTC.roomUserLimit;

		return window.wpcomGutenbergRTC.providers
			.map( ( provider: string ) => {
				switch ( provider ) {
					case 'http-polling': {
						if ( httpPollingCreator ) {
							return withRoomLimit( httpPollingCreator, roomUserLimit );
						}
						return null;
					}
					case 'pinghub': {
						return withRoomLimit( createPingHubProvider(), roomUserLimit );
					}
					default:
						return null;
				}
			} )
			.filter( Boolean );
	};

	addFilter( 'sync.providers', 'wpcom/gutenberg-rtc-providers', getProviders );
}

registerWpcomGutenbergProviders();
