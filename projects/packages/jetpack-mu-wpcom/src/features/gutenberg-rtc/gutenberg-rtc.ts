import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './providers/pinghub';
import { triggerRoomLimitBreach, withRoomLimit } from './room-limit';
import type { ProviderCreator } from '@wordpress/sync';

declare global {
	interface Window {
		wpcomGutenbergRTC?: {
			providers?: string[];
<<<<<<< HEAD
			maxPeersPerRoom?: number;
			maxClientsPerUser?: number;
=======
			roomUserLimit?: number;
>>>>>>> d04887b473 (Ensure pooling is disabled on 429)
		};
	}
}

<<<<<<< HEAD
=======
const SYNC_UPDATES_PATH = '/wp-sync/v1/updates';
const ROOM_LIMIT_ERROR_CODE = 'rest_sync_connection_limit_exceeded';
let isRoomLimitMiddlewareRegistered = false;

/**
 * Narrow an apiFetch result to a Response-like object.
 *
 * @param value - Unknown apiFetch result.
 * @return True when the value exposes response status and clone.
 */
function isResponseLike( value: unknown ): value is Response {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	return 'status' in value && 'clone' in value;
}

/**
 * Register an apiFetch middleware that tears down providers when the sync
 * endpoint returns a room-limit response.
 */
function registerRoomLimitMiddleware(): void {
	if ( isRoomLimitMiddlewareRegistered ) {
		return;
	}
	isRoomLimitMiddlewareRegistered = true;

	apiFetch.use( ( options, next ) =>
		next( options ).then( ( response: unknown ) => {
			const path = typeof options.path === 'string' ? options.path : '';

			if ( path !== SYNC_UPDATES_PATH || ! isResponseLike( response ) ) {
				return response;
			}

			const maybeResponse = response as Response;
			if ( maybeResponse.status !== 429 ) {
				return response;
			}

			void maybeResponse
				.clone()
				.json()
				.then( ( data: unknown ) => {
					if (
						data &&
						typeof data === 'object' &&
						'code' in data &&
						data.code === ROOM_LIMIT_ERROR_CODE
					) {
						triggerRoomLimitBreach();
					}
				} )
				.catch( () => {} );

			return response;
		} )
	);
}

>>>>>>> d04887b473 (Ensure pooling is disabled on 429)
/**
 * Register providers (e.g. PingHub, HTTP polling) supplied by the server,
 * each wrapped with a room-user-limit enforcer.
 */
function registerWpcomGutenbergProviders() {
	registerRoomLimitMiddleware();

	const getProviders = ( defaultProviders: unknown[] ) => {
		if ( ! window.wpcomGutenbergRTC?.providers ) {
			return defaultProviders;
		}

		const maxPeersPerRoom = window.wpcomGutenbergRTC.maxPeersPerRoom;
		const maxClientsPerUser = window.wpcomGutenbergRTC.maxClientsPerUser;

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
			.map( creator => withRoomLimit( creator, maxPeersPerRoom, maxClientsPerUser ) );
	};

	addFilter( 'sync.providers', 'wpcom/gutenberg-rtc-providers', getProviders );
}

registerWpcomGutenbergProviders();
