/**
 * External dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import {
	CONNECTION_EVENTS,
	placementProps,
	trackConnectionEvent,
} from '../../helpers/connection-tracking.ts';
import useUnlinkUser from '../../hooks/use-unlink-user';
import DisconnectActionFooter from '../shared/disconnect-action-footer';
import ManageConnectionActionCard from '../shared/manage-connection-action-card';
import useConnection from '../use-connection';
import './style.scss';
import type { ConnectionPlacement } from '../../helpers/connection-tracking.ts';
import type { MouseEvent } from 'react';

interface OwnerDisconnectDialogProps {
	/** Whether the dialog is open. */
	isOpen?: boolean;
	/** Callback for when the dialog is closed. */
	onClose: () => void;
	/** API root URL. */
	apiRoot: string;
	/** API nonce. */
	apiNonce: string;
	/** Callback after user is unlinked. */
	onUnlinked?: () => void;
	/** Opens the ownership transfer flow. Omit to hide that action. */
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
 * The Owner Disconnect Dialog component.
 *
 * @param {OwnerDisconnectDialogProps} props - Component props.
 * @return {import('react').ReactNode} The OwnerDisconnectDialog component.
 */
const OwnerDisconnectDialog = ( {
	isOpen,
	onClose,
	apiRoot,
	apiNonce,
	onUnlinked,
	onTransferOwnership,
	context,
	placement,
}: OwnerDisconnectDialogProps ) => {
	const { isDisconnecting, error: disconnectError, unlink } = useUnlinkUser();

	// Add these string constants
	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );
	const disconnectText = __( 'Disconnect', 'jetpack-connection-js' );

	// The hook seeds the REST API singleton from these values, and reports offline mode,
	// where WordPress.com cannot be reached to action the disconnect.
	const { isOfflineMode } = useConnection( { apiRoot, apiNonce } );

	const handleTransferClick = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e?.preventDefault();
			trackConnectionEvent( CONNECTION_EVENTS.ownerTransferClick, context, {
				...placementProps( placement ),
				location: 'owner_disconnect_dialog',
			} );
			onTransferOwnership?.();
		},
		[ context, placement, onTransferOwnership ]
	);

	const handleStayConnected = useCallback( () => {
		onClose();
	}, [ onClose ] );

	const handleDisconnectAnyway = useCallback( () => {
		trackConnectionEvent(
			'jetpack_manage_connection_dialog_owner_disconnect_click',
			context,
			placementProps( placement )
		);

		unlink( {
			force: true,
			disconnectAllUsers: true,
			errorMessage: __(
				'There was a problem disconnecting your account. Please try again.',
				'jetpack-connection-js'
			),
		} ).then( succeeded => {
			trackConnectionEvent(
				succeeded
					? 'jetpack_manage_connection_dialog_owner_disconnect_success'
					: 'jetpack_manage_connection_dialog_owner_disconnect_error',
				context,
				placementProps( placement )
			);

			if ( succeeded ) {
				onUnlinked && onUnlinked();
			}
		} );
	}, [ context, placement, onUnlinked, unlink ] );

	return (
		isOpen && (
			<Modal
				title=""
				contentLabel={ __( 'Disconnect owner account', 'jetpack-connection-js' ) }
				aria={ {
					labelledby: 'jp-connection__owner-disconnect-dialog__heading',
				} }
				onRequestClose={ handleStayConnected }
				shouldCloseOnEsc={ ! isDisconnecting }
				shouldCloseOnClickOutside={ ! isDisconnecting }
				className="jp-connection__disconnect-dialog"
			>
				<div className="jp-connection__disconnect-dialog__content">
					<h1 id="jp-connection__owner-disconnect-dialog__heading">
						{ __( 'Disconnect owner account', 'jetpack-connection-js' ) }
					</h1>
					<p className="jp-connection__disconnect-dialog__large-text">
						{ __(
							'Disconnecting the owner account without choosing a new owner will remove the Jetpack connection for all users on this site. The site will remain connected.',
							'jetpack-connection-js'
						) }
					</p>
					{ onTransferOwnership && (
						<ManageConnectionActionCard
							title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
							onClick={ handleTransferClick }
							action="transfer"
							disabled={ isDisconnecting }
						/>
					) }
				</div>
				<DisconnectActionFooter
					stayLabel={ __( 'Stay connected', 'jetpack-connection-js' ) }
					stayDisabled={ isDisconnecting }
					onStay={ handleStayConnected }
					disconnectLabel={ isDisconnecting ? disconnectingText : disconnectText }
					disconnectDisabled={ isDisconnecting || isOfflineMode }
					onDisconnect={ handleDisconnectAnyway }
					error={ disconnectError }
				/>
			</Modal>
		)
	);
};

export default OwnerDisconnectDialog;
