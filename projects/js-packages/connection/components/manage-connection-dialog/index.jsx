/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { Button, getRedirectUrl, Text } from '@automattic/jetpack-components';
import { ExternalLink, Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight, external } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
/**
 * Internal dependencies
 */
import DisconnectDialog from '../disconnect-dialog';
import './style.scss';

/**
 * The RNA Manage Connection Dialog component.
 *
 * @param {object} props -- The properties.
 * @return {React.JSX} The `ManageConnectionDialog` component.
 */
const ManageConnectionDialog = props => {
	const {
		title = __( 'Manage your Jetpack connection', 'jetpack-connection-js' ),
		apiRoot,
		apiNonce,
		connectedPlugins,
		onDisconnected,
		onUnlinked,
		context = 'jetpack-dashboard',
		connectedUser = {}, // Pass empty object to avoid undefined errors.
		connectedSiteId,
		isOpen = false,
		onClose,
	} = props;

	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const [ isDisconnectingUser, setIsDisconnectingUser ] = useState( false );

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Open the Disconnect Dialog.
	 */
	const openDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( true );
		},
		[ setIsDisconnectDialogOpen ]
	);

	/**
	 * Close the Disconnect Dialog.
	 */
	const closeDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( false );
		},
		[ setIsDisconnectDialogOpen ]
	);

	const isCurrentUserAdmin = useMemo( () => {
		return !! connectedUser.currentUser?.permissions?.manage_options;
	}, [ connectedUser.currentUser ] );

	const _disconnectUser = useCallback( () => {
		// Not connected to WPCOM? bail.
		if ( ! connectedUser.currentUser.isConnected ) {
			return;
		}

		setIsDisconnectingUser( true );

		restApi
			// Passing true to unlink will force the user disconnection
			// This is needed for an admin to disconnect themselves
			.unlinkUser( isCurrentUserAdmin )
			.then( () => {
				setIsDisconnectingUser( false );
				onClose();
				onUnlinked();
			} )
			.catch( () => {
				setIsDisconnectingUser( false );
			} );
	}, [ setIsDisconnectingUser, isCurrentUserAdmin, onUnlinked, onClose, connectedUser ] );

	const handleDisconnectUser = useCallback(
		e => {
			e && e.preventDefault();
			_disconnectUser();
		},
		[ _disconnectUser ]
	);

	const isControlsDisabled = useMemo( () => {
		return isDisconnectingUser;
	}, [ isDisconnectingUser ] );

	return (
		<>
			{ isOpen && (
				<>
					<Modal
						title=""
						contentLabel={ title }
						aria={ {
							labelledby: 'jp-connection__manage-dialog__heading',
						} }
						shouldCloseOnClickOutside={ false }
						shouldCloseOnEsc={ false }
						isDismissible={ false }
						className={ 'jp-connection__manage-dialog' }
					>
						<div className="jp-connection__manage-dialog__content">
							<h1 id="jp-connection__manage-dialog__heading">{ title }</h1>
							<Text className="jp-connection__manage-dialog__large-text">
								{ __(
									'At least one user must be connected for your Jetpack products to work properly.',
									'jetpack-connection-js'
								) }
							</Text>
							{ isCurrentUserAdmin && (
								<ManageConnectionActionCard
									title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
									link={ getRedirectUrl( 'calypso-settings-manage-connection', {
										site: window?.myJetpackInitialState?.siteSuffix,
									} ) }
									key="transfer"
									action="transfer"
									disabled={ isControlsDisabled }
								/>
							) }
							{ connectedUser.currentUser.isConnected && (
								<ManageConnectionActionCard
									title={
										isDisconnectingUser
											? __( 'Disconnecting…', 'jetpack-connection-js' )
											: __( 'Disconnect my user account', 'jetpack-connection-js' )
									}
									onClick={ handleDisconnectUser }
									key="unlink"
									action="unlink"
									disabled={ isControlsDisabled }
								/>
							) }
							{ isCurrentUserAdmin && (
								<ManageConnectionActionCard
									title={ __( 'Disconnect Jetpack', 'jetpack-connection-js' ) }
									onClick={ openDisconnectDialog }
									key="disconnect"
									action="disconnect"
									disabled={ isControlsDisabled }
								/>
							) }
						</div>
						<HelpFooter onClose={ onClose } disabled={ isControlsDisabled } />
					</Modal>

					<DisconnectDialog
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						onDisconnected={ onDisconnected }
						connectedPlugins={ connectedPlugins }
						connectedSiteId={ connectedSiteId }
						connectedUser={ connectedUser }
						isOpen={ isDisconnectDialogOpen }
						onClose={ closeDisconnectDialog }
						context={ context }
					/>
				</>
			) }
		</>
	);
};

const ManageConnectionActionCard = ( {
	title,
	onClick = () => null,
	link = '#',
	action,
	disabled,
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
				>
					{ title }
					<Icon
						icon={ action === 'disconnect' || action === 'unlink' ? chevronRight : external }
						className="jp-connection__manage-dialog__action-card__icon"
					/>
				</a>
			</div>
		</div>
	);
};

const HelpFooter = ( { onClose, disabled } ) => {
	return (
		<div className="jp-row jp-connection__manage-dialog__actions">
			<div className="jp-connection__manage-dialog__text-wrap lg-col-span-9 md-col-span-7 sm-col-span-3">
				<Text>
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
									className="jp-connection__manage-dialog__link"
									// TODO add click track
								/>
							),
							supportLink: (
								<ExternalLink
									href={ getRedirectUrl( 'jetpack-support' ) }
									className="jp-connection__manage-dialog__link"
									// TODO add click track
								/>
							),
						}
					) }
				</Text>
			</div>
			<div className="jp-connection__manage-dialog__button-wrap lg-col-span-3 md-col-span-1 sm-col-span-1">
				<Button
					weight="regular"
					variant="secondary"
					onClick={ onClose }
					className="jp-connection__manage-dialog__btn-dismiss"
					disabled={ disabled }
				>
					{ __( 'Cancel', 'jetpack-connection-js' ) }
				</Button>
			</div>
		</div>
	);
};

ManageConnectionDialog.propTypes = {
	/** The modal title. */
	title: PropTypes.string,
	/** API root URL, required. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce, required. */
	apiNonce: PropTypes.string.isRequired,
	/** Plugins that are using the Jetpack connection. */
	connectedPlugins: PropTypes.oneOfType( [ PropTypes.array, PropTypes.object ] ),
	/** The callback to be called upon disconnection success. */
	onDisconnected: PropTypes.func,
	/** The callback to be called upon user unlink success. */
	onUnlinked: PropTypes.func,
	/** The context in which this component is being used. */
	context: PropTypes.string,
	/** An object representing the connected user. */
	connectedUser: PropTypes.object,
	/** ID of the currently connected site. */
	connectedSiteId: PropTypes.number,
	/** Whether or not the dialog modal should be open. */
	isOpen: PropTypes.bool,
	/** Callback function for when the modal closes. */
	onClose: PropTypes.func,
};

export default ManageConnectionDialog;
