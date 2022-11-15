import { Button, getRedirectUrl } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
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
							<p className="jp-connection__manage-dialog__large-text">
								{ __(
									'At least one user must be connected for your Jetpack products to work properly.',
									'jetpack'
								) }
							</p>
							<ManageConnectionButton
								title={ __( 'Transfer ownership to another admin', 'jetpack' ) }
								link={ getRedirectUrl( 'calypso-settings-manage-connection', {
									site: window?.myJetpackInitialState?.siteSuffix,
								} ) }
								key="transfer"
							/>
							<ManageConnectionButton
								title={ __( 'Disconnect Jetpack', 'jetpack' ) }
								onClick={ openDisconnectDialog }
								key="disconnect"
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

const ManageConnectionButton = ( { title, onClick = () => null, link = '#' } ) => {
	return (
		<div className="jp-connection__disconnect-card card">
			<div className="jp-connection__disconnect-card__card-content">
				<a
					href={ link }
					className="jp-connection__disconnect-card__card-headline"
					onClick={ onClick }
				>
					{ ' ' }
					{ title }
				</a>
			</div>
		</div>
	);
};

const HelpFooter = ( { onClose } ) => {
	return (
		<div className="jp-row jp-connection__manage-dialog__actions">
			<div className="jp-connection__manage-dialog__text-wrap lg-col-span-10 md-col-span-6 sm-col-span-8">
				<p>
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
				</p>
			</div>
			<div className="jp-connection__manage-dialog__button-wrap lg-col-span-2 md-col-span-6 sm-col-span-4">
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
