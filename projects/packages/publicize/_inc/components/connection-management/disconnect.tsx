import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { AlertDialog, Button, Link } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

export type DisconnectProps = {
	connection: Connection;
	variant?: 'outline' | 'minimal' | 'link';
	/** Button size. Defaults to "small"; the Social dashboard passes "compact". */
	size?: 'small' | 'compact';
	/** Button tone. Defaults to the WPDS default; the Social dashboard passes "neutral". */
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
	const [ isConfirmOpen, setIsConfirmOpen ] = useState( false );
	const toggleConfirm = useCallback( () => setIsConfirmOpen( open => ! open ), [] );

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

	// `AlertDialog` closes itself once the handler settles, and disables its
	// buttons while the promise is in flight — so unlike the old ConfirmDialog
	// this must not toggle the open state itself.
	const onClickDisconnect = useCallback( async () => {
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
		[ isDisconnecting, toggleConfirm ]
	);

	if ( ! canManageConnection ) {
		return null;
	}

	const label = isDisconnecting
		? __( 'Disconnecting…', 'jetpack-publicize-pkg' )
		: _x( 'Disconnect', 'Disconnect a social media account', 'jetpack-publicize-pkg' );

	return (
		<>
			{ /*
			 * A WPDS dialog rather than a `@wordpress/components` ConfirmDialog, so
			 * the confirmation matches the connections modal it opens from. Both
			 * portal to `document.body` at z-index auto, so the later-mounted
			 * confirmation stacks above the modal on DOM order alone — do not move
			 * either into the compat overlay slot without moving both.
			 */ }
			<AlertDialog.Root
				open={ isConfirmOpen }
				onOpenChange={ setIsConfirmOpen }
				onConfirm={ onClickDisconnect }
			>
				<AlertDialog.Popup
					title={ _x( 'Disconnect', 'Disconnect a social media account', 'jetpack-publicize-pkg' ) }
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
				</AlertDialog.Popup>
			</AlertDialog.Root>
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
