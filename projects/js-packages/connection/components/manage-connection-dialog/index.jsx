import { Button, getRedirectUrl, H3 } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import DisconnectDialog from '../disconnect-dialog';

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
						title={ title }
						contentLabel={ title }
						aria={ {
							labelledby: 'jp-connection__manage-dialog__heading',
						} }
						shouldCloseOnClickOutside={ false }
						shouldCloseOnEsc={ false }
						isDismissible={ false }
						className={ 'jp-connection__manage-dialog' }
					>
						<H3>
							{ __(
								'At least one user must be connected for your Jetpack products to work properly.',
								'jetpack'
							) }
						</H3>
						<Button // Uses the wpcom connection transfer page, this functionality is not yet available in MyJetpack
							variant="primary"
							isExternalLink={ true }
							fullWidth={ true }
							href={ getRedirectUrl( 'calypso-settings-manage-connection', {
								site: window?.myJetpackInitialState?.siteSuffix,
							} ) }
						>
							{ __( 'Transfer ownership to another admin', 'jetpack' ) }
						</Button>
						<Button
							variant="primary"
							fullWidth={ true }
							isDestructive={ true }
							onClick={ openDisconnectDialog }
						>
							{ __( 'Disconnect Jetpack', 'jetpack' ) }
						</Button>
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

const HelpFooter = ( { onClose } ) => {
	return (
		<div className="jp-row">
			<div className="lg-col-span-7 md-col-span-8 sm-col-span-4">
				<p>
					{ createInterpolateElement(
						__(
							'<strong>Need help?</strong> Learn more about the <connectionInfoLink>Jetpack connection</connectionInfoLink> or <supportLink>contact Jetpack support</supportLink>.',
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
									className="jp-connection__disconnect-dialog__link"
									// TODO add click track
								/>
							),
							supportLink: (
								<a
									href={ getRedirectUrl( 'jetpack-support' ) }
									rel="noopener noreferrer"
									target="_blank"
									className="jp-connection__disconnect-dialog__link"
									// TODO add click track
								/>
							),
						}
					) }
				</p>
			</div>
			<div className="jp-connection__disconnect-dialog__button-wrap lg-col-span-5 md-col-span-8 sm-col-span-4">
				<Button
					variant="primary"
					className="jp-connection__disconnect-dialog__btn-dismiss"
					onClick={ onClose }
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
