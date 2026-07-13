/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Link } from '@wordpress/ui';
import { useCallback, useState, useEffect } from 'react';
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
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

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
				<div className="jp-connection__disconnect-dialog__actions">
					<div className="jp-row">
						<div className="lg-col-span-8 md-col-span-9 sm-col-span-4">
							<p>
								{ createInterpolateElement(
									__(
										'<strong>Need help?</strong> Learn more about the <connectionInfoLink>Jetpack connection</connectionInfoLink> or <supportLink>contact Jetpack support</supportLink>',
										'jetpack-connection-js'
									),
									{
										strong: <strong></strong>,
										connectionInfoLink: (
											<Link
												openInNewTab
												href={ getRedirectUrl(
													'why-the-wordpress-com-connection-is-important-for-jetpack'
												) }
												className="jp-connection__disconnect-dialog__link"
											/>
										),
										supportLink: (
											<Link
												openInNewTab
												href={ getRedirectUrl( 'jetpack-support' ) }
												className="jp-connection__disconnect-dialog__link"
											/>
										),
									}
								) }
							</p>
						</div>
						<div className="jp-connection__disconnect-dialog__button-wrap lg-col-span-4 md-col-span-7 sm-col-span-4">
							<Button
								onClick={ handleStayConnected }
								className="jp-connection__disconnect-dialog__btn-dismiss"
							>
								{ __( 'Stay Connected', 'jetpack-connection-js' ) }
							</Button>
							<Button
								onClick={ handleDisconnectAnyway }
								className="jp-connection__disconnect-dialog__btn-disconnect"
								disabled={ isDisconnecting }
							>
								{ isDisconnecting ? disconnectingText : disconnectText }
							</Button>
						</div>
					</div>
					{ disconnectError && (
						<p className="jp-connection__disconnect-dialog__error">{ disconnectError }</p>
					) }
				</div>
			</Modal>
		)
	);
};

export default OwnerDisconnectDialog;
