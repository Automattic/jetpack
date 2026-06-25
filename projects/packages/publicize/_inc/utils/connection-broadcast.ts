export const CONNECTION_BROADCAST_CHANNEL = 'jetpack-social-connection';

export type ConnectionCreatedMessage = {
	type: 'connection-created';
	service: string;
	connectionId: string;
};

/**
 * Broadcast that a connection was created, so an editor tab that opened the flow can refresh.
 *
 * @param service      - Service id.
 * @param connectionId - The new connection id.
 */
export function broadcastConnectionCreated( service: string, connectionId: string ): void {
	if ( typeof BroadcastChannel === 'undefined' ) {
		return;
	}

	const channel = new BroadcastChannel( CONNECTION_BROADCAST_CHANNEL );
	channel.postMessage( { type: 'connection-created', service, connectionId } );
	channel.close();
}

/**
 * Subscribe to connection-created broadcasts.
 *
 * @param onCreated - Called when a connection is created in another tab.
 * @return Unsubscribe function.
 */
export function subscribeToConnectionCreated(
	onCreated: ( message: ConnectionCreatedMessage ) => void
): () => void {
	if ( typeof BroadcastChannel === 'undefined' ) {
		return () => undefined;
	}

	const channel = new BroadcastChannel( CONNECTION_BROADCAST_CHANNEL );

	const handler = ( event: MessageEvent ) => {
		if ( event.data?.type === 'connection-created' ) {
			onCreated( event.data );
		}
	};

	channel.addEventListener( 'message', handler );

	return () => {
		channel.removeEventListener( 'message', handler );
		channel.close();
	};
}
