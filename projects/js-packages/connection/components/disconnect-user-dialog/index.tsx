/**
 * External dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { placementProps, trackConnectionEvent } from '../../helpers/connection-tracking.ts';
/**
 * Internal dependencies
 */
import useUnlinkUser from '../../hooks/use-unlink-user';
import OwnerDisconnectDialog from '../owner-disconnect-dialog';
import DisconnectActionFooter from '../shared/disconnect-action-footer';
import useConnection from '../use-connection';
import type { ConnectionPlacement } from '../../helpers/connection-tracking.ts';

export interface DisconnectUserDialogProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback for when the dialog is dismissed without disconnecting. */
	onClose: () => void;
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Callback after the user is unlinked. The host decides what closes and what reloads. */
	onUnlinked?: () => void;
	/** Opens the ownership transfer flow, offered to an owner. Omit to hide that action. */
	onTransferOwnership?: () => void;
	/**
	 * The context in which this component is being used, recorded with the dialog's events.
	 * Sent as null when omitted, so a caller that forgot it is findable in the data rather than
	 * attributed to another surface.
	 */
	context?: string;
	/** Where on the page the dialog was opened from, e.g. 'header'. Sent as `placement` when set. */
	placement?: ConnectionPlacement;
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
	onUnlinked,
	onTransferOwnership,
	context,
	placement,
}: DisconnectUserDialogProps ) => {
	const { isDisconnecting, error: disconnectError, unlink } = useUnlinkUser();

	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );
	const disconnectText = __( 'Disconnect', 'jetpack-connection-js' );

	// The hook seeds the REST API singleton from these values, so the dialog needs no
	// initializer of its own, and reports offline mode, where WordPress.com cannot be
	// reached to action the disconnect.
	const { userConnectionData, isOfflineMode } = useConnection( { apiRoot, apiNonce } );
	const currentUser = userConnectionData?.currentUser;

	const isAdmin = !! currentUser?.permissions?.manage_options;

	// Which dialog the viewer gets is settled when they open it, not re-read as they use it:
	// a successful owner disconnect clears isMaster, which would otherwise swap the cascade
	// warning for the plain confirm under them while the host is still closing or reloading.
	const [ prevIsOpen, setPrevIsOpen ] = useState( isOpen );
	const [ isOwner, setIsOwner ] = useState( () => !! currentUser?.isMaster );
	if ( isOpen !== prevIsOpen ) {
		setPrevIsOpen( isOpen );
		if ( isOpen ) {
			setIsOwner( !! currentUser?.isMaster );
		}
	}

	const handleDisconnect = useCallback( () => {
		trackConnectionEvent(
			'jetpack_manage_connection_dialog_disconnect_user_click',
			context,
			placementProps( placement )
		);

		// Separate statements, not a ternary: the minifier folds two `__()` calls in one
		// expression into a single call with a non-literal argument, which i18n-check rejects.
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

		// Forced for an administrator, who needs it to unlink themselves.
		unlink( { force: isAdmin, errorMessage } ).then( succeeded => {
			if ( succeeded ) {
				onUnlinked?.();
			}
		} );
	}, [ context, placement, isAdmin, onUnlinked, unlink ] );

	if ( isOwner ) {
		return (
			<OwnerDisconnectDialog
				isOpen={ isOpen }
				onClose={ onClose }
				apiRoot={ apiRoot }
				apiNonce={ apiNonce }
				onUnlinked={ onUnlinked }
				onTransferOwnership={ onTransferOwnership }
				context={ context }
				placement={ placement }
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
				shouldCloseOnEsc={ ! isDisconnecting }
				shouldCloseOnClickOutside={ ! isDisconnecting }
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
					disconnectDisabled={ isDisconnecting || isOfflineMode }
					onDisconnect={ handleDisconnect }
					error={ disconnectError }
				/>
			</Modal>
		)
	);
};

export default DisconnectUserDialog;
