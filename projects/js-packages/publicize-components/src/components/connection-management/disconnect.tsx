import { Button } from '@automattic/jetpack-components';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useCallback, useReducer } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type DisconnectProps = {
	connection: Connection;
	variant?: React.ComponentProps< typeof Button >[ 'variant' ];
	isDestructive?: boolean;
	buttonClassName?: string;
};
/**
 * Disconnect component
 *
 * @param {DisconnectProps} props - component props
 *
 * @return {import('react').ReactNode} - React element
 */
export function Disconnect( {
	connection,
	variant = 'secondary',
	isDestructive = true,
	buttonClassName,
}: DisconnectProps ) {
	const [ isConfirmOpen, toggleConfirm ] = useReducer( state => ! state, false );

	const { deleteConnectionById } = useDispatch( socialStore );

	const { isDisconnecting, canManageConnection } = useSelect(
		select => {
			const { getDeletingConnections, canUserManageConnection } = select( socialStore );

			return {
				isDisconnecting: getDeletingConnections().includes( connection.connection_id ),
				canManageConnection: canUserManageConnection( connection ),
			};
		},
		[ connection ]
	);

	const onClickDisconnect = useCallback( async () => {
		toggleConfirm();

		await deleteConnectionById( {
			connectionId: connection.connection_id,
		} );
	}, [ connection.connection_id, deleteConnectionById ] );

	if ( ! canManageConnection ) {
		return null;
	}

	return (
		<>
			<ConfirmDialog
				className={ styles.confirmDialog }
				isOpen={ isConfirmOpen }
				onConfirm={ onClickDisconnect }
				onCancel={ toggleConfirm }
				cancelButtonText={ __( 'Cancel', 'jetpack-publicize-components' ) }
				confirmButtonText={ __( 'Yes', 'jetpack-publicize-components' ) }
			>
				{ createInterpolateElement(
					sprintf(
						// translators: %s: The name of the connection the user is disconnecting.
						__(
							'Are you sure you want to disconnect <strong>%s</strong>?',
							'jetpack-publicize-components'
						),
						connection.display_name
					),
					{ strong: <strong></strong> }
				) }
			</ConfirmDialog>
			<Button
				size="small"
				onClick={ toggleConfirm }
				disabled={ isDisconnecting }
				variant={ variant }
				isDestructive={ isDestructive }
				className={ buttonClassName }
			>
				{ isDisconnecting
					? __( 'Disconnecting…', 'jetpack-publicize-components' )
					: _x(
							'Disconnect',
							'Disconnect a social media account',
							'jetpack-publicize-components'
					  ) }
			</Button>
		</>
	);
}
