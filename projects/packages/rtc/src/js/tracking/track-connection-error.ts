import { addFilter } from '@wordpress/hooks';
import { isRoomLimitBreached } from '../notices/room-limit';
import { recordRtcEvent } from './tracks';
import type { ConnectionStatus, ProviderCreator } from '@wordpress/sync';

const CONNECTION_ERROR_EVENT = 'jetpack_rtc_connection_error';

/**
 * Whether a disconnect is the per-room-limit case, which is reported separately
 * as `jetpack_rtc_blocked` and so must be skipped here to avoid double-counting.
 *
 * Recognised by the `connection-limit-exceeded` code the room-limit wrapper
 * emits, or the `isRoomLimitBreached()` flag it sets — the same distinction the
 * connection-error modal uses.
 *
 * @param status - The disconnected status emitted by the provider.
 * @return True for the room-limit disconnect.
 */
function isRoomLimitDisconnect( status: ConnectionStatus ): boolean {
	const code = status.status === 'disconnected' ? status.error?.code : undefined;
	return code === 'connection-limit-exceeded' || isRoomLimitBreached();
}

/**
 * Wrap a provider creator so the first genuine (non-limit) connection loss on an
 * entity room records a `jetpack_rtc_connection_error` Tracks event.
 *
 * The signal is the provider's own `disconnected` status, not Gutenberg's error
 * modal: the modal is shown via a filter whose API has changed across Gutenberg
 * versions (and the component variant is gated behind `IS_GUTENBERG_PLUGIN`),
 * whereas the provider status is the transport-agnostic source of truth that
 * drives it. The PingHub transport emits a bare `disconnected` with no `error`,
 * so an `error` is not required; `error_code` is reported when the transport
 * supplies one (e.g. `authentication-failed`, `protocol-mismatch`).
 *
 * Records at most once per provider — a connection that keeps dropping and
 * retrying emits repeated `disconnected` events, but the metric only needs the
 * first occurrence per room. A clean teardown (navigating away, switching posts)
 * also emits `disconnected`, so the `tearingDown` guard keeps it from counting
 * as an error. Collection rooms (objectId === null) are ignored, matching the
 * room-limit and join-tracking wrappers.
 *
 * `transport`, `post_id`, `post_type`, and `wp_user_id` are added by
 * `recordRtcEvent`; this only supplies the error code.
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
		let tearingDown = false;

		result.on( 'status', ( status: ConnectionStatus ) => {
			if ( recorded || tearingDown || status.status !== 'disconnected' ) {
				return;
			}
			if ( isRoomLimitDisconnect( status ) ) {
				return;
			}
			recorded = true;
			recordRtcEvent( CONNECTION_ERROR_EVENT, {
				error_code: status.error?.code,
			} );
		} );

		return {
			...result,
			destroy: () => {
				tearingDown = true;
				result.destroy();
			},
		};
	};
}

/**
 * Register the connection-error-tracking wrapper on the sync.providers filter.
 *
 * Runs at priority 30 — outside the room-limit wrapper (priority 20) — so it
 * observes the synthetic `connection-limit-exceeded` status that wrapper emits
 * (and skips it), alongside the join-tracking wrapper.
 */
export function registerConnectionErrorTracking(): void {
	addFilter(
		'sync.providers',
		'jetpack/rtc-connection-error-tracking',
		( providers: ProviderCreator[] ) => providers.map( withConnectionErrorTracking ),
		30
	);
}
