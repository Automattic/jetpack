import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useCallback, useReducer } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Button, Link } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import styles from './style.module.scss';

export type DisconnectProps = {
	connection: Connection;
	variant?: 'outline' | 'minimal' | 'link';
	/** Button size. Defaults to "small"; the modernized chassis passes "compact". */
	size?: 'small' | 'compact';
	/** Button tone. Defaults to the WPDS default; the modernized chassis passes "neutral". */
	tone?: 'neutral';
};
/**
 * Disconnect component
 *
 * @param {DisconnectProps} props            - component props
 * @param {Connection}      props.connection - the connection to disconnect
 * @param {string}          props.variant    - button variant
 * @param {string}          props.size       - button size
 * @param {string}          props.tone       - button tone
 *
 * @return {import('react').ReactNode} - React element
 */
export function Disconnect( {
	connection,
	variant = 'outline',
	size = 'small',
	tone,
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

	const onLinkClick = useCallback(
		( event: React.MouseEvent ) => {
			event.preventDefault();
			if ( ! isDisconnecting ) {
				toggleConfirm();
			}
		},
		[ isDisconnecting ]
	);

	if ( ! canManageConnection ) {
		return null;
	}

	const label = isDisconnecting
		? __( 'Disconnecting…', 'jetpack-publicize-pkg' )
		: _x( 'Disconnect', 'Disconnect a social media account', 'jetpack-publicize-pkg' );

	return (
		<>
			<ConfirmDialog
				className={ styles.confirmDialog }
				isOpen={ isConfirmOpen }
				onConfirm={ onClickDisconnect }
				onCancel={ toggleConfirm }
				cancelButtonText={ __( 'Cancel', 'jetpack-publicize-pkg' ) }
				confirmButtonText={ __( 'Yes', 'jetpack-publicize-pkg' ) }
			>
				{ createInterpolateElement(
					sprintf(
						// translators: %s: The name of the connection the user is disconnecting.
						__(
							'Are you sure you want to disconnect <strong>%s</strong>?',
							'jetpack-publicize-pkg'
						),
						connection.display_name
					),
					{ strong: <strong></strong> }
				) }
			</ConfirmDialog>
			{ variant === 'link' ? (
				<Link
					variant="default"
					href="#"
					aria-disabled={ isDisconnecting || undefined }
					onClick={ onLinkClick }
				>
					{ label }
				</Link>
			) : (
				<Button
					size={ size }
					tone={ tone }
					variant={ variant }
					onClick={ toggleConfirm }
					disabled={ isDisconnecting }
				>
					{ label }
				</Button>
			) }
		</>
	);
}
