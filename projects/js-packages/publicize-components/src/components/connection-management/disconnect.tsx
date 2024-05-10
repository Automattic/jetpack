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
	label?: string;
	onDisconnect?: VoidFunction;
	showSuccessNotice?: boolean;
	variant?: React.ComponentProps< typeof Button >[ 'variant' ];
	isDestructive?: boolean;
	showConfirmation?: boolean;
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
	showConfirmation = true,
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
			showSuccessNotice,
		} );

		onDisconnect?.();
	}, [ connection.connection_id, deleteConnectionById, onDisconnect, showSuccessNotice ] );

	if ( ! connection.can_disconnect ) {
		return null;
	}

	return (
		<>
			{ showConfirmation && (
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
			) }
			<Button
				size="small"
				onClick={ showConfirmation ? toggleConfirm : onClickDisconnect }
				disabled={ isDisconnecting }
				variant={ variant }
				isDestructive={ isDestructive }
			>
				{ isDisconnecting
					? __( 'Disconnecting…', 'jetpack' )
					: label || _x( 'Disconnect', 'Disconnect a social media account', 'jetpack' ) }
			</Button>
		</>
	);
}
