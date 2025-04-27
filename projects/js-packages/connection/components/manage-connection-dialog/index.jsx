/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
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
import ConnectionErrorNotice from '../connection-error-notice/index.jsx';
import DisconnectDialog from '../disconnect-dialog';
import OwnerDisconnectDialog from '../owner-disconnect-dialog';
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
	const [ unlinkError, setUnlinkError ] = useState( '' );
	const [ isOwnerDisconnectDialogOpen, setIsOwnerDisconnectDialogOpen ] = useState( false );

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
		if ( ! connectedUser.currentUser?.isConnected ) {
			return;
		}

		setIsDisconnectingUser( true );
		setUnlinkError( '' );

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
				let errorMessage = __(
					'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please visit your plugins page and make sure all Jetpack plugins are updated.',
					'jetpack-connection-js'
				);
				if ( ! isCurrentUserAdmin ) {
					errorMessage = __(
						'There was some trouble disconnecting your user account, your Jetpack plugin(s) may be outdated. Please ask a site admin to update Jetpack',
						'jetpack-connection-js'
					);
				}
				setUnlinkError( errorMessage );
				setIsDisconnectingUser( false );
			} );
	}, [
		setIsDisconnectingUser,
		setUnlinkError,
		isCurrentUserAdmin,
		onUnlinked,
		onClose,
		connectedUser,
	] );

	const handleDisconnectUser = useCallback(
		e => {
			e && e.preventDefault();

			// If user is connection owner, show warning modal instead of disconnecting
			if ( connectedUser.currentUser?.isMaster ) {
				setIsOwnerDisconnectDialogOpen( true );
				return;
			}

			// Existing disconnect logic for non-owners
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_manage_connection_dialog_disconnect_user_click',
				{ context: context }
			);
			_disconnectUser();
		},
		[ _disconnectUser, context, connectedUser ]
	);

	const isControlsDisabled = useMemo( () => {
		return isDisconnectingUser;
	}, [ isDisconnectingUser ] );

	// This is silly, but it's an optimizer workaround
	const disconnectingText = __( 'Disconnecting…', 'jetpack-connection-js' );

	const handleCloseOwnerDialog = useCallback( () => {
		setIsOwnerDisconnectDialogOpen( false );
	}, [ setIsOwnerDisconnectDialogOpen ] );

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
							{ isCurrentUserAdmin &&
								connectedUser.currentUser?.isConnected &&
								connectedUser.currentUser?.isMaster && (
									<ManageConnectionActionCard
										title={ __( 'Transfer ownership to another admin', 'jetpack-connection-js' ) }
										link={ getRedirectUrl( 'calypso-settings-manage-connection', {
											site: window?.myJetpackInitialState?.siteSuffix,
										} ) }
										isExternal={ true }
										key="transfer"
										action="transfer"
										disabled={ isControlsDisabled }
									/>
								) }
							{ connectedUser.currentUser?.isConnected && (
								<>
									{ '' !== unlinkError && <ConnectionErrorNotice message={ unlinkError } /> }
									<ManageConnectionActionCard
										title={
											isDisconnectingUser
												? disconnectingText
												: __( 'Disconnect my user account', 'jetpack-connection-js' )
										}
										onClick={ handleDisconnectUser }
										key="unlink"
										action="unlink"
										disabled={ isControlsDisabled }
									/>
								</>
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

					<OwnerDisconnectDialog
						isOpen={ isOwnerDisconnectDialogOpen }
						onClose={ handleCloseOwnerDialog }
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						onDisconnected={ onDisconnected }
						onUnlinked={ onUnlinked }
					/>
				</>
			) }
		</>
	);
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
