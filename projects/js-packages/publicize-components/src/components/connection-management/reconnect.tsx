import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection, KeyringResult } from '../../social-store/types';
import { useRequestAccess } from '../services/use-request-access';
import { SupportedService } from '../services/use-supported-services';

export type ReconnectProps = {
	service: SupportedService;
	connection: Connection;
	variant?: React.ComponentProps< typeof Button >[ 'variant' ];
};

/**
 * Reconnect component
 *
 * @param {ReconnectProps} props - component props
 *
 * @return {import('react').ReactNode} - React element
 */
export function Reconnect( { connection, service, variant = 'link' }: ReconnectProps ) {
	const { deleteConnectionById, setKeyringResult, openConnectionsModal, setReconnectingAccount } =
		useDispatch( socialStore );

	const { isDisconnecting } = useSelect(
		select => {
			const { getDeletingConnections } = select( socialStore );

			return {
				isDisconnecting: getDeletingConnections().includes( connection.connection_id ),
			};
		},
		[ connection.connection_id ]
	);

	const onConfirm = useCallback(
		( result: KeyringResult ) => {
			setKeyringResult( result );

			if ( result?.ID ) {
				openConnectionsModal();
			}
		},
		[ openConnectionsModal, setKeyringResult ]
	);

	const requestAccess = useRequestAccess( { service, onConfirm } );

	const onClickReconnect = useCallback( async () => {
		const success = await deleteConnectionById( {
			connectionId: connection.connection_id,
			showSuccessNotice: false,
		} );

		if ( ! success ) {
			return;
		}

		await setReconnectingAccount( connection );

		const formData = new FormData();

		if ( service.ID === 'mastodon' ) {
			formData.set( 'instance', connection.external_display );
		}

		if ( service.ID === 'bluesky' ) {
			openConnectionsModal();
		} else {
			requestAccess( formData );
		}
	}, [
		connection,
		deleteConnectionById,
		openConnectionsModal,
		requestAccess,
		service.ID,
		setReconnectingAccount,
	] );

	if ( ! connection.can_disconnect ) {
		return null;
	}

	return (
		<Button
			size="small"
			onClick={ onClickReconnect }
			disabled={ isDisconnecting }
			variant={ variant }
		>
			{ isDisconnecting
				? __( 'Disconnecting…', 'jetpack-publicize-components' )
				: _x( 'Reconnect', 'Reconnect a social media account', 'jetpack-publicize-components' ) }
		</Button>
	);
}
