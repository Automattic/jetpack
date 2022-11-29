/**
 * External dependencies
 */
import { Button, getRedirectUrl, Text } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight, external } from '@wordpress/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import DisconnectDialog from '../disconnect-dialog';
import './style.scss';

/**
 * The RNA Manage Connection Dialog component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ManageConnectionDialog` component.
 */
const ManageConnectionDialog = props => {
	const {
		title,
		apiRoot,
		apiNonce,
		connectedPlugins,
		onDisconnected,
		context,
		connectedUser,
		connectedSiteId,
		isOpen,
		onClose,
	} = props;

	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );

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

	const handleEscapePress = useCallback(
		event => {
			if ( event.key === 'Escape' ) {
				document.removeEventListener( 'keydown', handleEscapePress, false );
				closeDisconnectDialog();
			}
		},
		[ closeDisconnectDialog ]
	);

	/**
	 * Open the Disconnect Dialog.
	 */
	const openDisconnectDialog = useCallback(
		e => {
			e && e.preventDefault();
			setIsDisconnectDialogOpen( true );
			document.addEventListener( 'keydown', handleEscapePress, false );
		},
		[ setIsDisconnectDialogOpen, handleEscapePress ]
	);

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
									'jetpack'
								) }
							</Text>
							<ManageConnectionActionCard
								title={ __( 'Transfer ownership to another admin', 'jetpack' ) }
								link={ getRedirectUrl( 'calypso-settings-manage-connection', {
									site: window?.myJetpackInitialState?.siteSuffix,
								} ) }
								key="transfer"
								action="transfer"
							/>
							<ManageConnectionActionCard
								title={ __( 'Disconnect Jetpack', 'jetpack' ) }
								onClick={ openDisconnectDialog }
								key="disconnect"
								action="disconnect"
							/>
						</div>
						<HelpFooter onClose={ onClose } />
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

const ManageConnectionActionCard = ( { title, onClick = () => null, link = '#', action } ) => {
	return (
		<div className="jp-connection__manage-dialog__action-card card">
			<div className="jp-connection__manage-dialog__action-card__card-content">
				<a
					href={ link }
					className={ classNames(
						'jp-connection__manage-dialog__action-card__card-headline',
						action
					) }
					onClick={ onClick }
				>
					{ title }
					<Icon
						icon={ action === 'disconnect' ? chevronRight : external }
						className="jp-connection__manage-dialog__action-card__icon"
					/>
				</a>
			</div>
		</div>
	);
};

const HelpFooter = ( { onClose } ) => {
	return (
		<div className="jp-row jp-connection__manage-dialog__actions">
			<div className="jp-connection__manage-dialog__text-wrap lg-col-span-8 md-col-span-6 sm-col-span-3">
				<Text>
					{ createInterpolateElement(
						__(
							'<strong>Need help?</strong> Learn more about the <connectionInfoLink>Jetpack connection</connectionInfoLink> or <supportLink>contact Jetpack support</supportLink>',
							'jetpack'
						),
						{
							strong: <strong></strong>,
							connectionInfoLink: (
								<a
									href={ getRedirectUrl(
										'why-the-wordpress-com-connection-is-important-for-jetpack'
									) }
									rel="noopener noreferrer"
									target="_blank"
									className="jp-connection__manage-dialog__link"
									// TODO add click track
								/>
							),
							supportLink: (
								<a
									href={ getRedirectUrl( 'jetpack-support' ) }
									rel="noopener noreferrer"
									target="_blank"
									className="jp-connection__manage-dialog__link"
									// TODO add click track
								/>
							),
						}
					) }
				</Text>
			</div>
			<div className="jp-connection__manage-dialog__button-wrap lg-col-span-4 md-col-span-2 sm-col-span-1">
				<Button
					weight="regular"
					variant="secondary"
					onClick={ onClose }
					className="jp-connection__manage-dialog__btn-dismiss"
				>
					{ __( 'Cancel', 'jetpack' ) }
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

ManageConnectionDialog.defaultProps = {
	title: __( 'Manage your Jetpack connection', 'jetpack' ),
	isOpen: false,
	context: 'jetpack-dashboard',
	connectedUser: {}, // Pass empty object to avoid undefined errors.
};

export default ManageConnectionDialog;
