import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

export type DisconnectProps = {
	connection: Connection;
	label?: string;
	onDisconnect?: VoidFunction;
	showSuccessNotice?: boolean;
	variant?: React.ComponentProps< typeof Button >[ 'variant' ];
	isDestructive?: boolean;
};

/**
 * Disconnect component
 *
 * @param {DisconnectProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function Disconnect( {
	connection,
	label,
	onDisconnect,
	showSuccessNotice = true,
	variant = 'secondary',
	isDestructive = true,
}: DisconnectProps ) {
	const { deleteConnectionById } = useDispatch( socialStore );

	const { isDisconnecting } = useSelect(
		select => {
			const { getDeletingConnections } = select( socialStore );

			return {
				isDisconnecting: getDeletingConnections().includes( connection.connection_id ),
			};
		},
		[ connection.connection_id ]
	);

	const onClickDisconnect = useCallback( async () => {
		await deleteConnectionById( {
			connectionId: connection.connection_id,
			showSuccessNotice,
		} );

		onDisconnect?.();
	}, [ connection.connection_id, deleteConnectionById, onDisconnect, showSuccessNotice ] );

	if ( ! connection.can_disconnect ) {
		return null;
	}

	return (
		<Button
			size="small"
			onClick={ onClickDisconnect }
			disabled={ isDisconnecting }
			variant={ variant }
			isDestructive={ isDestructive }
		>
			{ isDisconnecting
				? __( 'Disconnecting…', 'jetpack' )
				: label || _x( 'Disconnect', 'Disconnect a social media account', 'jetpack' ) }
		</Button>
	);
}
