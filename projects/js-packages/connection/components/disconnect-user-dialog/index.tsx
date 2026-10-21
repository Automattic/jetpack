/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import OwnerDisconnectDialog from '../owner-disconnect-dialog';
import DisconnectActionFooter from '../shared/disconnect-action-footer';
import useConnection from '../use-connection';

export interface DisconnectUserDialogProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback for when the dialog is dismissed without disconnecting. */
	onClose: () => void;
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Callback after the owner's disconnection takes the whole connection with it. */
	onDisconnected?: () => void;
	/** Callback after the user is unlinked. The host decides what closes and what reloads. */
	onUnlinked?: () => void;
	/** Opens the ownership transfer flow, offered to an owner. Omit to hide that action. */
	onTransferOwnership?: () => void;
	/** The context in which this component is being used. */
	context?: string;
}

/**
 * Confirmation dialog for disconnecting your own WordPress.com user account.
 *
 * Owns the owner/non-owner decision so no host repeats it: the owner gets the cascade
 * warning and a way out through transfer, everyone else a plain confirm.
 *
 * @param {DisconnectUserDialogProps} props - Component props.
 * @return {import('react').ReactNode} The DisconnectUserDialog component.
 */
const DisconnectUserDialog = ( {
	isOpen,
	onClose,
	apiRoot,
	apiNonce,
	onDisconnected,
	onUnlinked,
	onTransferOwnership,
	context = 'jetpack-dashboard',
}: DisconnectUserDialogProps ) => {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( '' );

	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );
	const disconnectText = __( 'Disconnect', 'jetpack-connection-js' );

	// The hook seeds the REST API singleton from these values, so the dialog needs no
	// initializer of its own.
	const { userConnectionData } = useConnection( { apiRoot, apiNonce } );
	const currentUser = userConnectionData?.currentUser;

	const isAdmin = !! currentUser?.permissions?.manage_options;
	const isOwner = !! currentUser?.isMaster;

	const handleDisconnect = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_manage_connection_dialog_disconnect_user_click', {
			context,
		} );

		setIsDisconnecting( true );
		setDisconnectError( '' );

		restApi
			// Passing true to unlink will force the user disconnection.
			// This is needed for an admin to disconnect themselves.
			.unlinkUser( isAdmin )
			.then( () => {
				setIsDisconnecting( false );
				onUnlinked?.();
			} )
			.catch( () => {
				let errorMessage: string = __(
					'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please visit your plugins page and make sure all Jetpack plugins are updated.',
					'jetpack-connection-js'
				);
				if ( ! isAdmin ) {
					errorMessage = __(
						'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please ask a site admin to update Jetpack',
						'jetpack-connection-js'
					);
				}
				setDisconnectError( errorMessage );
				setIsDisconnecting( false );
			} );
	}, [ context, isAdmin, onUnlinked ] );

	if ( isOwner ) {
		return (
			<OwnerDisconnectDialog
				isOpen={ isOpen }
				onClose={ onClose }
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				onDisconnected={ onDisconnected }
				onUnlinked={ onUnlinked }
				onTransferOwnership={ onTransferOwnership }
			/>
		);
	}

	const heading = __( 'Disconnect your user account', 'jetpack-connection-js' );

	return (
		isOpen && (
			<Modal
				title=""
				contentLabel={ heading }
				aria={ {
					labelledby: 'jp-connection__disconnect-user-dialog__heading',
				} }
				onRequestClose={ onClose }
				className="jp-connection__disconnect-dialog"
			>
				<div className="jp-connection__disconnect-dialog__content">
					<h1 id="jp-connection__disconnect-user-dialog__heading">{ heading }</h1>
					<p className="jp-connection__disconnect-dialog__large-text">
						{ __(
							'Are you sure you want to disconnect your WordPress.com account?',
							'jetpack-connection-js'
						) }
					</p>
				</div>
				<DisconnectActionFooter
					stayLabel={ __( 'Cancel', 'jetpack-connection-js' ) }
					stayDisabled={ isDisconnecting }
					onStay={ onClose }
					disconnectLabel={ isDisconnecting ? disconnectingText : disconnectText }
					disconnectDisabled={ isDisconnecting }
					onDisconnect={ handleDisconnect }
					error={ disconnectError }
				/>
			</Modal>
		)
	);
};

export default DisconnectUserDialog;
