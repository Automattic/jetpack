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

		const maxPeersPerRoom = window.wpcomGutenbergRTC.maxPeersPerRoom;

		return window.wpcomGutenbergRTC.providers
			.map( ( provider: string ) => {
				switch ( provider ) {
					case 'http-polling':
						return defaultProviders?.[ 0 ];
					case 'pinghub':
						return createPingHubProvider();
					default:
						return null;
				}
			} )
			.filter( ( creator ): creator is ProviderCreator => Boolean( creator ) )
			.map( creator => withRoomLimit( creator, maxPeersPerRoom ) );
	};

	addFilter( 'sync.providers', 'wpcom/gutenberg-rtc-providers', getProviders );
}

registerWpcomGutenbergProviders();
