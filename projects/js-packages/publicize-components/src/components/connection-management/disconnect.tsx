import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

export type DisconnectProps = {
	connection: Connection;
	onReconnect?: VoidFunction;
};

/**
 * Disconnect component
 *
 * @param {DisconnectProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function Disconnect( { connection, onReconnect }: DisconnectProps ) {
	const { deleteConnectionById } = useDispatch( socialStore );

	const { deletingConnection } = useSelect( select => {
		const store = select( socialStore );

		return {
			deletingConnection: store.getDeletingConnection(),
		};
	}, [] );

	const mustReconnect = connection.status !== 'ok';
	const isDisconnectingThis = deletingConnection === connection.connection_id;
	const isDisconnectingAny = Boolean( deletingConnection );

	const onDisconnect = useCallback( () => {
		deleteConnectionById( {
			connectionId: connection.connection_id,
			// We don't want to show the success notice if we're going to reconnect
			showSuccessNotice: ! mustReconnect,
		} );

		if ( mustReconnect ) {
			onReconnect?.();
		}
	}, [ connection.connection_id, deleteConnectionById, mustReconnect, onReconnect ] );

	if ( ! connection.can_disconnect ) {
		return null;
	}

	return (
		<Button
			size="small"
			variant="secondary"
			onClick={ onDisconnect }
			disabled={ isDisconnectingAny }
		>
			{ ( ( needsReconnection, isDisconnecting ) => {
				if ( needsReconnection ) {
					// Use _x to avoid messed up minification
					return isDisconnecting
						? __( 'Reconnecting…', 'jetpack' )
						: _x( 'Reconnect', 'Reconnect a social media account', 'jetpack' );
				}

				return isDisconnecting
					? __( 'Disconnecting…', 'jetpack' )
					: _x( 'Disconnect', 'Disconnect a social media account', 'jetpack' );
			} )( mustReconnect, isDisconnectingThis ) }
		</Button>
	);
}
