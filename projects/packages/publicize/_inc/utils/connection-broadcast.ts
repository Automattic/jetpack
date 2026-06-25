export const CONNECTION_BROADCAST_CHANNEL = 'jetpack-social-connection';

export type ConnectionCreatedMessage = {
	type: 'connection-created';
	service: string;
	connectionId: string;
};

export type ConnectionCancelledMessage = {
	type: 'connection-cancelled';
	service: string;
};

export type ConnectionMessage = ConnectionCreatedMessage | ConnectionCancelledMessage;

let sendChannel: BroadcastChannel | undefined;

/**
 * Lazily create a persistent channel for sending. Closing a channel right after postMessage drops
 * the message before it's dispatched to other tabs, so the sender channel is kept open for the
 * page's lifetime (the tab usually closes itself moments later anyway).
 *
 * @return The shared send channel, or undefined when BroadcastChannel is unavailable.
 */
function getSendChannel(): BroadcastChannel | undefined {
	if ( typeof BroadcastChannel === 'undefined' ) {
		return undefined;
	}

	if ( ! sendChannel ) {
		sendChannel = new BroadcastChannel( CONNECTION_BROADCAST_CHANNEL );
	}

	return sendChannel;
}

/**
 * Broadcast that a connection was created, so an editor tab that opened the flow can refresh.
 *
 * @param service      - Service id.
 * @param connectionId - The new connection id.
 */
export function broadcastConnectionCreated( service: string, connectionId: string ): void {
	getSendChannel()?.postMessage( { type: 'connection-created', service, connectionId } );
}

/**
 * Broadcast that an editor-opened connect flow was dismissed before a connection was made, so the
 * editor can clear its pending "Connecting…" state instead of waiting for the timeout.
 *
 * @param service - Service id the flow was for.
 */
export function broadcastConnectionCancelled( service: string ): void {
	getSendChannel()?.postMessage( { type: 'connection-cancelled', service } );
}

/**
 * Subscribe to connection broadcasts from a tab that opened the connect flow.
 *
 * @param handlers             - Event handlers.
 * @param handlers.onCreated   - Called when a connection was created.
 * @param handlers.onCancelled - Called when the flow was dismissed without connecting.
 * @return Unsubscribe function.
 */
export function subscribeToConnectionEvents( handlers: {
	onCreated?: ( message: ConnectionCreatedMessage ) => void;
	onCancelled?: ( message: ConnectionCancelledMessage ) => void;
} ): () => void {
	if ( typeof BroadcastChannel === 'undefined' ) {
		return () => undefined;
	}

	const channel = new BroadcastChannel( CONNECTION_BROADCAST_CHANNEL );

	const handler = ( event: MessageEvent ) => {
		const data = event.data as ConnectionMessage | undefined;

		if ( data?.type === 'connection-created' ) {
			handlers.onCreated?.( data );
		} else if ( data?.type === 'connection-cancelled' ) {
			handlers.onCancelled?.( data );
		}
	};

	channel.addEventListener( 'message', handler );

	return () => {
		channel.removeEventListener( 'message', handler );
		channel.close();
	};
}
