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

const ActionCard = ( {
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

const OwnerDisconnectDialog = ( { isOpen, onClose, apiRoot, apiNonce, onDisconnected } ) => {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( '' );

	// Define translation strings as constants
	const disconnectingText = __( 'Disconnecting…', 'jetpack' );
	const disconnectText = __( 'Disconnect', 'jetpack' );

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const handleStayConnected = useCallback( () => {
		onClose();
	}, [ onClose ] );

	const handleDisconnectAnyway = useCallback( () => {
		jetpackAnalytics.tracks.recordEvent(
			'jetpack_manage_connection_dialog_owner_disconnect_click'
		);

		setIsDisconnecting( true );
		setDisconnectError( '' );

		restApi
			.unlinkUser( true, { disconnectAllUsers: true } )
			.then( () => {
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_success'
				);
				onDisconnected && onDisconnected();
			} )
			.catch( () => {
				jetpackAnalytics.tracks.recordEvent(
					'jetpack_manage_connection_dialog_owner_disconnect_error'
				);
				setDisconnectError(
					__( 'There was a problem disconnecting your account. Please try again.', 'jetpack' )
				);
				setIsDisconnecting( false );
			} );
	}, [ onDisconnected ] );

	return (
		<Modal
			title=""
			contentLabel={ __( 'Disconnect Owner Account', 'jetpack' ) }
			aria={ { labelledby: 'jp-connection__disconnect-dialog__heading' } }
			onRequestClose={ handleStayConnected }
			className="jp-connection__disconnect-dialog"
			isOpen={ isOpen }
		>
			{ /* Modal content */ }
			<div className="jp-connection__disconnect-dialog__content">
				<h1 id="jp-connection__disconnect-dialog__heading">
					{ __( 'Disconnect Owner Account', 'jetpack' ) }
				</h1>
				<p className="jp-connection__disconnect-dialog__large-text">
					{ __(
						'Disconnecting the owner account will remove the Jetpack connection for all users on this site. The site will remain connected.',
						'jetpack'
					) }
				</p>
				<ActionCard
					title={ __( 'Transfer ownership to another admin', 'jetpack' ) }
					link={ getRedirectUrl( 'calypso-settings-manage-connection' ) }
					isExternal={ true }
					action="transfer"
				/>
				<ActionCard
					title={ __( 'View other connected accounts', 'jetpack' ) }
					link="users.php"
					action="check-users"
				/>
			</div>

			<div className="jp-connection__disconnect-dialog__actions">
				{ /* Footer content */ }
				<div className="jp-row">
					<div className="lg-col-span-8 md-col-span-9 sm-col-span-4">
						<p>
							{ createInterpolateElement(
								__(
									'<strong>Need help?</strong> Learn more about the <connectionInfoLink>Jetpack connection</connectionInfoLink> or <supportLink>contact Jetpack support</supportLink>',
									'jetpack'
								),
								{
									strong: <strong />,
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
							{ __( 'Stay Connected', 'jetpack' ) }
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
	);
};

OwnerDisconnectDialog.propTypes = {
	isOpen: PropTypes.bool,
	onClose: PropTypes.func,
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	onDisconnected: PropTypes.func,
};

export default OwnerDisconnectDialog;
