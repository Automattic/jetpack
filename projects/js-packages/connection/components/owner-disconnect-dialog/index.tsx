/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import useRestApiInit from '../../hooks/use-rest-api-init';
import DisconnectActionFooter from '../shared/disconnect-action-footer';
import ManageConnectionActionCard from '../shared/manage-connection-action-card';
import './style.scss';

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
}: OwnerDisconnectDialogProps ) => {
	// Add state for disconnect status and error
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( '' );

	// Add these string constants
	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );
	const disconnectText = __( 'Disconnect', 'jetpack-connection-js' );

	// Initialize the REST API
	useRestApiInit( apiRoot, apiNonce );

	const handleStayConnected = useCallback( () => {
		onClose();
	}, [ onClose ] );

	const handleDisconnectAnyway = useCallback( () => {
		// Track disconnect click
		jetpackAnalytics.tracks.recordEvent(
			'jetpack_manage_connection_dialog_owner_disconnect_click'
		);

		setIsDisconnecting( true );
		setDisconnectError( '' );

		// Disconnect owner with force and disconnect-all-users parameters
		restApi
			.unlinkUser( true, { disconnectAllUsers: true } )
			.then( () => {
				// Track successful disconnect
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_success'
				);
				// Don't close modal or change state since page will reload
				onDisconnected && onDisconnected();
				onUnlinked && onUnlinked();
			} )
			.catch( () => {
				// Track failed disconnect
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_error'
				);
				setDisconnectError(
					__(
						'There was a problem disconnecting your account. Please try again.',
						'jetpack-connection-js'
					)
				);
				setIsDisconnecting( false );
			} );
	}, [ onDisconnected, onUnlinked ] );

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
							'Disconnecting the owner account will remove the Jetpack connection for all users on this site. The site will remain connected.',
							'jetpack-connection-js'
						) }
					</p>
					<ManageConnectionActionCard
						title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
						link={ getRedirectUrl( 'calypso-settings-manage-connection', {
							site: ( window as Window & { myJetpackInitialState?: { siteSuffix?: string } } )
								?.myJetpackInitialState?.siteSuffix,
						} ) }
						isExternal={ true }
						action="transfer"
					/>
					<ManageConnectionActionCard
						title={ __( 'View other connected accounts', 'jetpack-connection-js' ) }
						link="users.php"
						action="check-users"
					/>
				</div>
				<DisconnectActionFooter
					stayLabel={ __( 'Stay connected', 'jetpack-connection-js' ) }
					onStay={ handleStayConnected }
					disconnectLabel={ isDisconnecting ? disconnectingText : disconnectText }
					disconnectDisabled={ isDisconnecting }
					onDisconnect={ handleDisconnectAnyway }
					error={ disconnectError }
				/>
			</Modal>
		)
	);
};

export default OwnerDisconnectDialog;
