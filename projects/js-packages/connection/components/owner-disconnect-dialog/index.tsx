/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { Modal } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../../state/store';
import DisconnectActionFooter from '../shared/disconnect-action-footer';
import ManageConnectionActionCard from '../shared/manage-connection-action-card';
import useConnection from '../use-connection';
import './style.scss';
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
	/** Callback after successful disconnection. */
	onDisconnected?: () => void;
	/** Callback after user is unlinked. */
	onUnlinked?: () => void;
	/** Opens the ownership transfer flow. Omit to hide that action. */
	onTransferOwnership?: () => void;
	/**
	 * The context in which this component is being used, recorded with the dialog's events.
	 * Deliberately undefined by default: a named fallback would attribute a caller that forgot
	 * it to the wrong surface, where an absent one is findable in the data.
	 */
	context?: string;
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
	onDisconnected,
	onUnlinked,
	onTransferOwnership,
	context,
}: OwnerDisconnectDialogProps ) => {
	// Add state for disconnect status and error
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( '' );

	// Add these string constants
	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );
	const disconnectText = __( 'Disconnect', 'jetpack-connection-js' );

	// The hook seeds the REST API singleton from these values, and reports offline mode,
	// where WordPress.com cannot be reached to action the disconnect.
	const { isOfflineMode } = useConnection( { apiRoot, apiNonce } );
	const { unlinkUser } = useDispatch( STORE_ID );

	const handleTransferClick = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e?.preventDefault();
			onTransferOwnership?.();
		},
		[ onTransferOwnership ]
	);

	const handleStayConnected = useCallback( () => {
		onClose();
	}, [ onClose ] );

	const handleDisconnectAnyway = useCallback( () => {
		// Track disconnect click
		jetpackAnalytics.tracks.recordEvent(
			'jetpack_manage_connection_dialog_owner_disconnect_click',
			{ context }
		);

		setIsDisconnecting( true );
		setDisconnectError( '' );

		// Disconnect owner with force and disconnect-all-users parameters
		unlinkUser( { force: true, disconnectAllUsers: true } )
			.then( () => {
				// Track successful disconnect
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_success',
					{ context }
				);
				// Don't close modal or change state since page will reload
				onDisconnected && onDisconnected();
				onUnlinked && onUnlinked();
			} )
			.catch( () => {
				// Track failed disconnect
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_error',
					{ context }
				);
				setDisconnectError(
					__(
						'There was a problem disconnecting your account. Please try again.',
						'jetpack-connection-js'
					)
				);
				setIsDisconnecting( false );
			} );
	}, [ context, onDisconnected, onUnlinked, unlinkUser ] );

	return (
		isOpen && (
			<Modal
				title=""
				contentLabel={ __( 'Disconnect Owner Account', 'jetpack-connection-js' ) }
				aria={ {
					labelledby: 'jp-connection__owner-disconnect-dialog__heading',
				} }
				onRequestClose={ handleStayConnected }
				className="jp-connection__disconnect-dialog"
			>
				<div className="jp-connection__disconnect-dialog__content">
					<h1 id="jp-connection__owner-disconnect-dialog__heading">
						{ __( 'Disconnect Owner Account', 'jetpack-connection-js' ) }
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
						/>
					) }
				</div>
				<DisconnectActionFooter
					stayLabel={ __( 'Stay connected', 'jetpack-connection-js' ) }
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
