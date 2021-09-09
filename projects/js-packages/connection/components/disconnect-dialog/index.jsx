/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import './style.scss';
import StepDisconnect from './steps/step-disconnect';
import StepDisconnectConfirm from './steps/step-disconnect-confirm';
import StepSurvey from './steps/step-survey';
import StepThankYou from './steps/step-thank-you';

/**
 * The RNA Disconnect Dialog component.
 *
 * @param {object} props -- The properties.
 * @param {string} props.apiRoot -- API root URL, required.
 * @param {string} props.apiNonce -- API Nonce, required.
 * @param {string} props.title -- The modal title.
 * @param {Function} props.onDisconnected -- The callback to be called upon disconnection success.
 * @param {Function} props.onError -- The callback to be called upon disconnection failure.
 * @param {Function} props.errorMessage -- The error message to display upon disconnection failure.
 * @returns {React.Component} The `DisconnectDialog` component.
 */

const DisconnectDialog = props => {
	const [ isOpen, setOpen ] = useState( false );

	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( false );

	const [ isProvidingFeedback, setIsProvidingFeedback ] = useState( false );
	const [ isFeedbackProvided, setIsFeedbackProvided ] = useState( false );

	const {
		apiRoot,
		apiNonce,
		title,
		activateButtonText,
		activateButtonClass,
		disconnectCallback,
		onDisconnected,
		onError,
		children,
		disconnectStepComponent,
		preloadComponent,
		context,
	} = props;

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

	const _disconnect = useCallback( () => {
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
	}, [ setIsDisconnecting, setIsDisconnected, setDisconnectError, onError ] );

	/**
	 * Disconnect - Triggered upon clicking the 'Disconnect' button.
	 */
	const handleDisconnect = useCallback(
		e => {
			e && e.preventDefault();

			setDisconnectError( false );
			setIsDisconnecting( true );

			// allow the disconnect action to be picked up by another component
			// this is primarily for the plugin context where the plugin needs to be deactivated as well
			if ( disconnectCallback ) {
				disconnectCallback( e );
				// maybe do some more stuff here before returning?
				return;
			}

			// default to making the disconnect API call here
			_disconnect();
		},
		[ setDisconnectError, setIsDisconnecting, disconnectCallback, _disconnect ]
	);

	/**
	 * Close modal and fire 'onDisconnected' callback if exists.
	 * Triggered upon clicking the 'Back To WordPress' button.
	 */
	const backToWordpress = useCallback(
		e => {
			e && e.preventDefault();

			if ( onDisconnected ) {
				onDisconnected();
			}

			closeModal();
		},
		[ onDisconnected, closeModal ]
	);

	const handleProvideFeedback = useCallback(
		e => {
			e && e.preventDefault();
			setIsProvidingFeedback( true );
		},
		[ setIsProvidingFeedback ]
	);

	const handleFeedbackProvided = useCallback(
		e => {
			e && e.preventDefault();
			setIsProvidingFeedback( false );
			setIsFeedbackProvided( true );
		},
		[ setIsFeedbackProvided, setIsProvidingFeedback ]
	);

	/**
	 * Determine what step to show based on the current state
	 *
	 * @returns { React.Component } - component for current step
	 */
	const getCurrentStep = () => {
		if ( ! isDisconnected ) {
			// disconnection screen
			return (
				<StepDisconnect
					title={ title }
					// what shows here can vary based on context/ what is passed by the parent.
					// not all WP REST API methods are available by default for this package (depends on what plugins are active).
					contents={ children }
					disconnectStepComponent={ disconnectStepComponent } // component that renders as part of the disconnect step, if passed
					isDisconnecting={ isDisconnecting }
					closeModal={ closeModal }
					onDisconnect={ handleDisconnect }
					errorMessage={ disconnectError }
					context={ context }
				/>
			);
		} else if ( isDisconnected && ! isProvidingFeedback && ! isFeedbackProvided ) {
			// disconnect confirm
			// ask the user about the survey
			return (
				<StepDisconnectConfirm
					onProvideFeedback={ handleProvideFeedback }
					onExit={ backToWordpress }
				/>
			);
		} else if ( isProvidingFeedback && ! isFeedbackProvided ) {
			// survey step
			// no data needed from site
			// send response to collection endpoint
			return (
				<StepSurvey onFeedBackProvided={ handleFeedbackProvided } onExit={ backToWordpress } />
			);
		} else if ( isFeedbackProvided ) {
			// thank you step
			// only visual output
			return <StepThankYou onExit={ backToWordpress } />;
		}
	};

	return (
		<>
			<Button
				variant="link"
				onClick={ openModal }
				className={ 'jp-disconnect-dialog__link ' + activateButtonClass }
			>
				{ activateButtonText }
			</Button>

			{ preloadComponent }

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
					{ getCurrentStep() }
				</Modal>
			) }
		</>
	);
};

DisconnectDialog.propTypes = {
	apiRoot: PropTypes.string.isRequired,
	apiNonce: PropTypes.string.isRequired,
	title: PropTypes.string,
	activateButtonText: PropTypes.string,
	onDisconnected: PropTypes.func,
	onError: PropTypes.func,
	errorMessage: PropTypes.string,
	context: PropTypes.string,
};

DisconnectDialog.defaultProps = {
	title: __( 'Are you sure you want to disconnect?', 'jetpack' ),
	activateButtonText: __( 'Disconnect', 'jetpack' ),
	errorMessage: __( 'Failed to disconnect. Please try again.', 'jetpack' ),
	context: __( 'jetpack-dashboard' ),
};

export default DisconnectDialog;
