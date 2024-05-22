import { Button } from '@automattic/jetpack-components';
// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
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
 * @returns {import('react').ReactNode} - React element
 */
export function Disconnect( {
	connection,
	variant = 'secondary',
	isDestructive = true,
	buttonClassName,
}: DisconnectProps ) {
	const [ isConfirmOpen, toggleConfirm ] = useReducer( state => ! state, false );

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
		toggleConfirm();

		await deleteConnectionById( {
			connectionId: connection.connection_id,
		} );
	}, [ connection.connection_id, deleteConnectionById ] );

	if ( ! connection.can_disconnect ) {
		return null;
	}

	return (
		<>
			<ConfirmDialog
				className={ styles.confirmDialog }
				isOpen={ isConfirmOpen }
				onConfirm={ onClickDisconnect }
				onCancel={ toggleConfirm }
				cancelButtonText={ __( 'Cancel', 'jetpack' ) }
				confirmButtonText={ __( 'Yes', 'jetpack' ) }
			>
				{ createInterpolateElement(
					sprintf(
						// translators: %s: The name of the connection the user is disconnecting.
						__( 'Are you sure you want to disconnect <strong>%s</strong>?', 'jetpack' ),
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
					? __( 'Disconnecting…', 'jetpack' )
					: _x( 'Disconnect', 'Disconnect a social media account', 'jetpack' ) }
			</Button>
		</>
	);
}
