/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import restApi from '@automattic/jetpack-api';
import jetpackAnalytics from '@automattic/jetpack-analytics';

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
 * @param {string} props.activateButtonText -- Text to show for the button that opens the modal.
 * @param {string} props.activateButtonClass -- Class to use on the button that opens the modal.
 * @param {Function} props.disconnectCallback -- Callback function that is called just before the request to disconnect is made.
 * @param {Function} props.onDisconnected -- The callback to be called upon disconnection success.
 * @param {Function} props.onError -- The callback to be called upon disconnection failure.
 * @param {React.Component} props.disconnectStepComponent -- A component to render as part of the disconnect step.
 * @param {string} props.context -- The context in which this component is being used.
 * @param {string} props.disconnectingPlugin -- The plugin where this component is being used that initiated the disconnect flow.
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
		connectedPlugins,
		title,
		activateButtonText,
		activateButtonClass,
		disconnectCallback,
		onDisconnected,
		onError,
		disconnectStepComponent,
		context,
		disconnectingPlugin,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Add a slug property to each ConnectedPlugins object so they can be converted to an array.
	 * This allows the connected plugins to be iterated over more easily for display.
	 */
	useEffect( () => {
		if ( connectedPlugins ) {
			const keys = Object.keys( connectedPlugins );
			keys.forEach( key => ( connectedPlugins[ key ].slug = key ) );
		}
	}, [ connectedPlugins ] );

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
	 * Disconnect the site.
	 * Uses the rest API to remove the Jetpack connection.
	 */
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
	 * Submit the optional survey following disconnection.
	 */
	const _submitSurvey = useCallback( surveyData => {
		// Use tracks to record the survey response.
		// This requires analytics scripts to be loaded.
		jetpackAnalytics.tracks.recordEvent( 'jetpack_plugin_disconnect_survey', surveyData );
		setIsFeedbackProvided( true );
	}, [] );

	/**
	 * Disconnect - Triggered upon clicking the 'Disconnect' button.
	 */
	const handleDisconnect = useCallback(
		e => {
			e && e.preventDefault();

			setDisconnectError( false );
			setIsDisconnecting( true );

			// Allow the disconnect action to be picked up by another component.
			// This is primarily for the plugin context where the plugin needs to be deactivated as well.
			if ( disconnectCallback ) {
				disconnectCallback( e );
				return;
			}

			// Default to making the disconnect API call here.
			_disconnect();
		},
		[ setDisconnectError, setIsDisconnecting, disconnectCallback, _disconnect ]
	);

	/**
	 * Submit Survey - triggered by clicking on the "Submit Feedback" button.
	 * Assembles the survey response.
	 */
	const handleSubmitSurvey = useCallback(
		( surveyAnswerId, surveyAnswerText, e ) => {
			e && e.preventDefault();

			const surveyData = {
				disconnect_reason: surveyAnswerId,
			};

			if ( surveyAnswerText ) {
				surveyData.disconnect_reason_text = surveyAnswerText;
			}

			_submitSurvey( surveyData );
		},
		[ _submitSurvey ]
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

	/**
	 * Update the local state to show the survey step.
	 */
	const handleProvideFeedback = useCallback(
		e => {
			e && e.preventDefault();
			setIsProvidingFeedback( true );
		},
		[ setIsProvidingFeedback ]
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
					// Filter out the current plugin ( if provided ) from the connected plugins.
					connectedPlugins={
						connectedPlugins
							? Object.values( connectedPlugins ).filter( plugin => {
									return disconnectingPlugin ? plugin.slug !== disconnectingPlugin : true;
							  } )
							: []
					}
					// Component that renders as part of the disconnect step, if passed.
					disconnectStepComponent={ disconnectStepComponent }
					isDisconnecting={ isDisconnecting }
					closeModal={ closeModal }
					onDisconnect={ handleDisconnect }
					disconnectError={ disconnectError }
					context={ context } // Where is the modal showing? ( most important for when it loads on the plugins page )
					disconnectingPlugin={ disconnectingPlugin } // Which plugin is initiating the disconnect.
				/>
			);
		} else if ( isDisconnected && ! isProvidingFeedback && ! isFeedbackProvided ) {
			// Confirm the disconnection, ask user about providing feedback.
			return (
				<StepDisconnectConfirm
					onProvideFeedback={ handleProvideFeedback }
					onExit={ backToWordpress }
				/>
			);
		} else if ( isProvidingFeedback && ! isFeedbackProvided ) {
			return <StepSurvey onFeedBackProvided={ handleSubmitSurvey } onExit={ backToWordpress } />;
		} else if ( isFeedbackProvided ) {
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
	connectedPlugins: PropTypes.object,
	connectedPluginsIsFetching: PropTypes.bool,
	disconnectingPlugin: PropTypes.string,
};

DisconnectDialog.defaultProps = {
	title: __( 'Are you sure you want to disconnect?', 'jetpack' ),
	activateButtonText: __( 'Disconnect', 'jetpack' ),
	errorMessage: __( 'Failed to disconnect. Please try again.', 'jetpack' ),
	context: __( 'jetpack-dashboard' ),
};

export default DisconnectDialog;
