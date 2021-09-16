/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { Button, Modal } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import restApi from '@automattic/jetpack-api';
import { JetpackLogo, getRedirectUrl } from '@automattic/jetpack-components';
import { fireEvent } from '@automattic/jetpack-observer';

/**
 * Internal dependencies
 */
import { CONNECTION_DISCONNECTED } from '../../events';
import { STORE_ID } from '../../state/store';
import './style.scss';

/**
 * The RNA Disconnect Dialog component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.title -- The modal title.
 * @param {Function} props.onError -- The callback to be called upon disconnection failure.
 * @param {Function} props.errorMessage -- The error message to display upon disconnection failure.
 * @returns {React.Component} The `DisconnectDialog` component.
 */

const DisconnectDialog = props => {
	const [ isOpen, setOpen ] = useState( false );

	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( false );

	const { setConnectionStatus } = useDispatch( STORE_ID );

	const { apiRoot, apiNonce, title, onError, errorMessage, children } = props;

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
	const openModal = useCallback(
		e => {
			e && e.preventDefault();
			setOpen( true );
		},
		[ setOpen ]
	);

	/**
	 * Close the Disconnect Dialog.
	 */
	const closeModal = useCallback(
		e => {
			e && e.preventDefault();
			setOpen( false );
		},
		[ setOpen ]
	);

	/**
	 * Disconnect - Triggered upon clicking the 'Disconnect' button.
	 */
	const disconnect = useCallback(
		e => {
			e && e.preventDefault();

			setDisconnectError( false );
			setIsDisconnecting( true );

			restApi
				.disconnectSite()
				.then( () => {
					setIsDisconnecting( false );

					setIsDisconnected( true );
				} )
				.catch( error => {
					setIsDisconnecting( false );
					setDisconnectError( error );

					if ( onError ) {
						onError( error );
					}
				} );
		},
		[ setIsDisconnecting, setIsDisconnected, setDisconnectError, onError ]
	);

	/**
	 * Close modal and fire the `CONNECTION_DISCONNECTED` event.
	 * Triggered upon clicking the 'Back To WordPress' button.
	 */
	const backToWordpress = useCallback(
		e => {
			e && e.preventDefault();

			setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );

			fireEvent( CONNECTION_DISCONNECTED );

			closeModal();
		},
		[ closeModal, setConnectionStatus ]
	);

	return (
		<>
			<Button variant="link" onClick={ openModal } className="jp-disconnect-dialog__link">
				{ __( 'Disconnect', 'jetpack' ) }
			</Button>

			{ isOpen && (
				<Modal
					title=""
					contentLabel={ title }
					aria={ {
						labelledby: 'jp-disconnect-dialog__heading',
					} }
					onRequestClose={ closeModal }
					shouldCloseOnClickOutside={ false }
					shouldCloseOnEsc={ false }
					isDismissible={ false }
					className={
						'jp-disconnect-dialog' + ( isDisconnected ? ' jp-disconnect-dialog__success' : '' )
					}
				>
					{ ! isDisconnected && (
						<div>
							<div className="jp-disconnect-dialog__content">
								<h1 id="jp-disconnect-dialog__heading">{ title }</h1>

								{ children }
							</div>

							<div className="jp-disconnect-dialog__actions">
								<div className="jp-row">
									<div className="lg-col-span-8 md-col-span-8 sm-col-span-4">
										<p>
											{ createInterpolateElement(
												__(
													'<strong>Need help?</strong> Learn more about the <jpConnectionInfoLink>Jetpack connection</jpConnectionInfoLink> or <jpSupportLink>contact Jetpack support</jpSupportLink>',
													'jetpack'
												),
												{
													strong: <strong></strong>,
													jpConnectionInfoLink: (
														<a
															href={ getRedirectUrl(
																'why-the-wordpress-com-connection-is-important-for-jetpack'
															) }
															rel="noopener noreferrer"
															target="_blank"
															className="jp-disconnect-dialog__link"
														/>
													),
													jpSupportLink: (
														<a
															href={ getRedirectUrl( 'jetpack-support' ) }
															rel="noopener noreferrer"
															target="_blank"
															className="jp-disconnect-dialog__link"
														/>
													),
												}
											) }
										</p>
									</div>
									<div className="jp-disconnect-dialog__button-wrap lg-col-span-4 md-col-span-8 sm-col-span-4">
										<Button
											isPrimary
											disabled={ isDisconnecting }
											onClick={ closeModal }
											className="jp-disconnect-dialog__btn-dismiss"
										>
											{ __( 'Stay connected', 'jetpack' ) }
										</Button>
										<Button
											isPrimary
											disabled={ isDisconnecting }
											onClick={ disconnect }
											className="jp-disconnect-dialog__btn-disconnect"
										>
											{ __( 'Disconnect', 'jetpack' ) }
										</Button>
									</div>
								</div>
								{ disconnectError && (
									<p className="jp-disconnect-dialog__error">{ errorMessage }</p>
								) }
							</div>
						</div>
					) }

					{ isDisconnected && (
						<div>
							<JetpackLogo />

							<h1>
								{ createInterpolateElement(
									__( 'Jetpack has been <br/>successfully disconnected.', 'jetpack' ),
									{
										br: <br />,
									}
								) }
							</h1>

							<Button
								isPrimary
								onClick={ backToWordpress }
								className="jp-disconnect-dialog__btn-back-to-wp"
							>
								{ __( 'Back to WordPress', 'jetpack' ) }
							</Button>
						</div>
					) }
				</Modal>
			) }
		</>
	);
};

DisconnectDialog.propTypes = {
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	title: PropTypes.string,
	onError: PropTypes.func,
	errorMessage: PropTypes.string,
};

DisconnectDialog.defaultProps = {
	title: __( 'Are you sure you want to disconnect?', 'jetpack' ),
	errorMessage: __( 'Failed to disconnect. Please try again.', 'jetpack' ),
};

export default DisconnectDialog;
