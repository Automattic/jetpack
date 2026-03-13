import apiFetch from '@wordpress/api-fetch';
import { addFilter } from '@wordpress/hooks';
import { createPingHubProvider } from './providers/pinghub';
import { triggerRoomLimitBreach, withRoomLimit } from './room-limit';
import type { ProviderCreator } from '@wordpress/sync';

declare global {
	interface Window {
		wpcomGutenbergRTC?: {
			providers?: string[];
			maxPeersPerRoom?: number;
			maxClientsPerUser?: number;
		};
	}
}

const SYNC_UPDATES_PATH = '/wp-sync/v1/updates';
let isRoomLimitMiddlewareRegistered = false;

/**
 * Narrow an apiFetch error to an object with a numeric `status` field.
 *
 * @param value - Unknown apiFetch error.
 * @return True when the value exposes an HTTP status.
 */
function hasStatusCode( value: unknown ): value is { status: number } {
	return (
		!! value && typeof value === 'object' && 'status' in value && typeof value.status === 'number'
	);
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

	apiFetch.use( ( options, next ) => {
		const path = typeof options.path === 'string' ? options.path : '';
		if ( ! path.startsWith( SYNC_UPDATES_PATH ) ) {
			return next( options );
		}

		return next( options ).catch( ( error: unknown ) => {
			if ( hasStatusCode( error ) && error.status === 429 ) {
				triggerRoomLimitBreach();
			}
			throw error;
		} );
	} );
}

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
