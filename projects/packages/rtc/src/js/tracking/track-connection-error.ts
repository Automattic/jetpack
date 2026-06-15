import { addFilter } from '@wordpress/hooks';
import { isRoomLimitBreached } from '../notices/room-limit';
import { recordRtcEvent } from './tracks';
import type { ConnectionStatus, ProviderCreator } from '@wordpress/sync';

const CONNECTION_ERROR_EVENT = 'jetpack_rtc_connection_error';

/**
 * Whether a status event represents a genuine, non-limit connection error.
 *
 * A clean disconnect (no `error`, e.g. page teardown or a normal close) is not
 * an error. The per-room-limit case is deliberately skipped: it is already
 * reported as `jetpack_rtc_blocked`, so counting it here too would double-count.
 * The limit case is recognised exactly as the connection-error modal recognises
 * it — the `connection-limit-exceeded` code (emitted by the room-limit wrapper)
 * or the `isRoomLimitBreached()` flag that wrapper sets.
 *
 * @param status - The connection status emitted by the provider.
 * @return True for a genuine, non-limit connection error.
 */
function isGenuineConnectionError( status: ConnectionStatus ): boolean {
	if ( status.status !== 'disconnected' || ! status.error ) {
		return false;
	}
	return status.error.code !== 'connection-limit-exceeded' && ! isRoomLimitBreached();
}

/**
 * Wrap a provider creator so the first genuine (non-limit) connection error on
 * an entity room records a `jetpack_rtc_connection_error` Tracks event.
 *
 * Records at most once per provider: a flapping connection emits repeated
 * `disconnected` events, but the metric only needs the first occurrence per
 * room. `transport`, `post_id`, `post_type`, and `wp_user_id` are added by
 * `recordRtcEvent`; this only supplies the error code.
 *
 * Collection rooms (objectId === null) are ignored — they disconnect in lockstep
 * with the entity room on a network drop, so tracking both would double-count.
 * This matches the room-limit and join-tracking wrappers.
 *
 * @param creator - The provider creator to wrap.
 * @return The wrapped provider creator.
 */
export function withConnectionErrorTracking( creator: ProviderCreator ): ProviderCreator {
	return async options => {
		const result = await creator( options );
		if ( options.objectId === null ) {
			return result;
		}

		let recorded = false;
		result.on( 'status', ( status: ConnectionStatus ) => {
			if ( recorded || ! isGenuineConnectionError( status ) ) {
				return;
			}
			recorded = true;
			recordRtcEvent( CONNECTION_ERROR_EVENT, {
				error_code: status.status === 'disconnected' ? status.error?.code : undefined,
			} );
		} );

		return result;
	};
}

/**
 * Register the connection-error-tracking wrapper on the sync.providers filter.
 *
 * Runs at priority 30 — outside the room-limit wrapper (priority 20) — so it
 * observes the synthetic `connection-limit-exceeded` status that wrapper emits
 * and skips it, alongside the join-tracking wrapper.
 */
export function registerConnectionErrorTracking(): void {
	addFilter(
		'sync.providers',
		'jetpack/rtc-connection-error-tracking',
		( providers: ProviderCreator[] ) => providers.map( withConnectionErrorTracking ),
		30
	);
}
