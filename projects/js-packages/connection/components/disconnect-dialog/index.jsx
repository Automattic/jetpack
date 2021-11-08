/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
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
 * @returns {React.Component} The `DisconnectDialog` component.
 */
const DisconnectDialog = props => {
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
		pluginScreenDisconnectCallback,
		onDisconnected,
		onError,
		disconnectStepComponent,
		context,
		disconnectingPlugin,
		connectedUser,
		isOpen,
		onClose,
	} = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	/**
	 * Initialize tracks with user data.
	 * Should run when we have a connected user.
	 */
	useEffect( () => {
		if ( connectedUser && connectedUser.ID && connectedUser.login ) {
			jetpackAnalytics.initialize( connectedUser.ID, connectedUser.login );
		}
	}, [ connectedUser, connectedUser.ID, connectedUser.login ] );

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
		jetpackAnalytics.tracks.recordEvent( 'plugin_jetpack_disconnect_survey', surveyData );
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

			// Detect the plugin context, where the plugin needs to be deactivated.
			if ( context === 'plugins' ) {
				// Use a callback function to handle deactivating the plugin.
				// This should effectively short-circuit the disconnect flow by redirecting to deactivate the plugin.
				if ( pluginScreenDisconnectCallback ) {
					pluginScreenDisconnectCallback( e );
				}
				// Do not disconnect if context is the plugin screen, the plugin deactivation routine will handle disconnection.
				return;
			}

			// Default to making the disconnect API call here.
			_disconnect();
		},
		[ setDisconnectError, setIsDisconnecting, pluginScreenDisconnectCallback, context, _disconnect ]
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
				plugin: disconnectingPlugin,
			};

			if ( surveyAnswerText ) {
				surveyData.disconnect_reason_text = surveyAnswerText;
			}

			_submitSurvey( surveyData );
		},
		[ disconnectingPlugin, _submitSurvey ]
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

			onClose();
		},
		[ onDisconnected, onClose ]
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
			// Disconnection screen.
			return (
				<StepDisconnect
					title={ title }
					connectedPlugins={ connectedPlugins }
					// Component that renders as part of the disconnect step, if passed.
					disconnectStepComponent={ disconnectStepComponent }
					isDisconnecting={ isDisconnecting }
					closeModal={ onClose }
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
			{ isOpen && (
				<Modal
					title=""
					contentLabel={ title }
					aria={ {
						labelledby: 'jp-connection__disconnect-dialog__heading',
					} }
					onRequestClose={ onClose }
					shouldCloseOnClickOutside={ false }
					shouldCloseOnEsc={ false }
					isDismissible={ false }
					className={
						'jp-connection__disconnect-dialog' +
						( isDisconnected ? ' jp-connection__disconnect-dialog__success' : '' )
					}
				>
					{ getCurrentStep() }
				</Modal>
			) }
		</>
	);
};

DisconnectDialog.propTypes = {
	/** API root URL, required. */
	apiRoot: PropTypes.string.isRequired,
	/** API Nonce, required. */
	apiNonce: PropTypes.string.isRequired,
	/** The modal title. */
	title: PropTypes.string,
	/** The callback to be called upon disconnection success. */
	onDisconnected: PropTypes.func,
	/** The callback to be called upon disconnection failure. */
	onError: PropTypes.func,
	/** The context in which this component is being used. */
	context: PropTypes.string,
	/** Plugins that are using the Jetpack connection. */
	connectedPlugins: PropTypes.object,
	/** The plugin where this component is being used that initiated the disconnect flow. */
	disconnectingPlugin: PropTypes.string,
	/** Callback function that is called just before the request to disconnect is made when the context is "plugins". */
	pluginScreenDisconnectCallback: PropTypes.func,
	/** A component to render as part of the disconnect step. */
	disconnectStepComponent: PropTypes.element,
	/** An object representing the connected user. */
	connectedUser: PropTypes.object,
	/** Whether or not the dialog modal should be open. */
	isOpen: PropTypes.bool,
	/** Callback function for when the modal closes. */
	onClose: PropTypes.func,
};

DisconnectDialog.defaultProps = {
	title: __( 'Are you sure you want to disconnect?', 'jetpack' ),
	context: 'jetpack-dashboard',
	connectedUser: {}, // Pass empty object to avoid undefined errors.
};

export default DisconnectDialog;
