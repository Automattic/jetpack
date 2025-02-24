/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink, Modal, Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight, external } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback, useState, useEffect } from 'react';
import './style.scss';

/**
 * The Owner Disconnect Dialog component.
 *
 * @param {object}   props                - Component props.
 * @param {boolean}  props.isOpen         - Whether the dialog is open.
 * @param {Function} props.onClose        - Callback for when the dialog is closed.
 * @param {string}   props.apiRoot        - API root URL.
 * @param {string}   props.apiNonce       - API nonce.
 * @param {Function} props.onDisconnected - Callback after successful disconnection.
 * @param {Function} props.onUnlinked     - Callback after user is unlinked.
 * @return {React.Component} The OwnerDisconnectDialog component.
 */
const OwnerDisconnectDialog = ( {
	isOpen,
	onClose,
	apiRoot,
	apiNonce,
	onDisconnected,
	onUnlinked,
} ) => {
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
					labelledby: 'jp-connection__disconnect-dialog__heading',
				} }
				onRequestClose={ handleStayConnected }
				className="jp-connection__disconnect-dialog"
			>
				<div className="jp-connection__disconnect-dialog__content">
					<h1 id="jp-connection__disconnect-dialog__heading">
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
							site: window?.myJetpackInitialState?.siteSuffix,
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
											<ExternalLink
												href={ getRedirectUrl(
													'why-the-wordpress-com-connection-is-important-for-jetpack'
												) }
												className="jp-connection__disconnect-dialog__link"
											/>
										),
										supportLink: (
											<ExternalLink
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
								variant="primary"
								onClick={ handleStayConnected }
								className="jp-connection__disconnect-dialog__btn-dismiss"
							>
								{ __( 'Stay Connected', 'jetpack-connection-js' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ handleDisconnectAnyway }
								className="jp-connection__disconnect-dialog__btn-disconnect"
								isDestructive
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

OwnerDisconnectDialog.propTypes = {
	/** Whether the dialog is open */
	isOpen: PropTypes.bool,
	/** Callback for when the dialog is closed */
	onClose: PropTypes.func,
	/** API root URL */
	apiRoot: PropTypes.string.isRequired,
	/** API nonce */
	apiNonce: PropTypes.string.isRequired,
	/** Callback after successful disconnection */
	onDisconnected: PropTypes.func,
	/** Callback after user is unlinked */
	onUnlinked: PropTypes.func,
};

const ManageConnectionActionCard = ( {
	title,
	onClick = () => null,
	isExternal = false,
	link = '#',
	action,
	disabled = false,
} ) => {
	const disabledCallback = useCallback( e => e.preventDefault(), [] );

	return (
		<div
			className={
				'jp-connection__manage-dialog__action-card card' + ( disabled ? ' disabled' : '' )
			}
		>
			<div className="jp-connection__manage-dialog__action-card__card-content">
				<a
					href={ link }
					className={ clsx( 'jp-connection__manage-dialog__action-card__card-headline', action ) }
					onClick={ ! disabled ? onClick : disabledCallback }
					target={ isExternal ? '_blank' : '_self' }
					rel={ 'noopener noreferrer' }
				>
					{ title }
					<Icon
						icon={ isExternal ? external : chevronRight }
						className="jp-connection__manage-dialog__action-card__icon"
					/>
				</a>
			</div>
		</div>
	);
};

export default OwnerDisconnectDialog;
