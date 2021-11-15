/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import restApi from '@automattic/jetpack-api';
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { jetpackConfigHas, jetpackConfigGet } from '@automattic/jetpack-config';

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
		connectedUser,
		connectedSiteId,
		isOpen,
		onClose,
	} = props;

	let disconnectingPlugin = '';
	if ( jetpackConfigHas( 'consumer_slug' ) ) {
		disconnectingPlugin = jetpackConfigGet( 'consumer_slug' );
	}

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
	const _submitSurvey = useCallback(
		( surveyData, tracksSurveyData ) => {
			// Send survey response to wpcom
			const base = 'https://public-api.wordpress.com';
			const path = '/wpcom/v2/marketing/feedback-survey';
			const method = 'POST';

			setIsProvidingFeedback( true );

			// We cannot use `@wordpress/api-fetch` here since it unconditionally sends
			// the `X-WP-Nonce` header, which is disallowed by WordPress.com.
			// If the submission receives an error, there's not really anything the user is able to do to fix it.
			// In these cases, just go ahead and show the last survey step.
			fetch( base + path, {
				method: method,
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify( surveyData ),
			} )
				.then(
					result => {
						return result.json();
					},
					// Error in sending the data.
					() => {
						setIsFeedbackProvided( true );
						setIsProvidingFeedback( false );
						// Send a tracks event for an error in survey submission.
						jetpackAnalytics.tracks.recordEvent(
							'plugin_jetpack_disconnect_survey_error',
							tracksSurveyData
						);
					}
				)
				.then( jsonResponse => {
					// response received
					if ( true === jsonResponse.success ) {
						// Send a tracks event for survey submission.
						jetpackAnalytics.tracks.recordEvent(
							'plugin_jetpack_disconnect_survey',
							tracksSurveyData
						);
					} else {
						// Send a tracks event for an error in survey submission.
						jetpackAnalytics.tracks.recordEvent(
							'plugin_jetpack_disconnect_survey_error',
							tracksSurveyData
						);
					}

					setIsFeedbackProvided( true );
					setIsProvidingFeedback( false );
				} );
		},
		[ setIsProvidingFeedback, setIsFeedbackProvided ]
	);

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
	 * Do we have the necessary data to be able to submit a survey?
	 * Need to have the ID of the connected user and the ID of the connected site.
	 */
	const canProvideFeedback = useCallback( () => {
		return connectedUser.ID && connectedSiteId;
	}, [ connectedUser, connectedSiteId ] );

	/**
	 * Submit Survey - triggered by clicking on the "Submit Feedback" button.
	 * Assembles the survey response.
	 */
	const handleSubmitSurvey = useCallback(
		( surveyAnswerId, surveyAnswerText, e ) => {
			e && e.preventDefault();

			// We do not have the information needed to record the response.
			// return early and move to the last step in the flow anyway.
			if ( ! canProvideFeedback() ) {
				setIsFeedbackProvided( true );
				return;
			}

			// Format the survey data for submission.
			const surveyData = {
				site_id: connectedSiteId,
				user_id: connectedUser.ID,
				survey_id: 'jetpack-plugin-disconnect',
				survey_responses: {
					'why-cancel': {
						response: surveyAnswerId,
						text: surveyAnswerText ? surveyAnswerText : null,
					},
				},
			};

			// Additional data for analytics to see where disconnections happened from.
			const tracksSurveyData = {
				disconnect_reason: surveyAnswerId,
				plugin: disconnectingPlugin,
				context: context,
			};

			if ( surveyAnswerText ) {
				surveyData.disconnect_reason_text = surveyAnswerText;
			}

			_submitSurvey( surveyData, tracksSurveyData );
		},
		[
			disconnectingPlugin,
			context,
			_submitSurvey,
			setIsFeedbackProvided,
			canProvideFeedback,
			connectedSiteId,
			connectedUser,
		]
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
					canProvideFeedback={ canProvideFeedback() }
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
	/** Callback function that is called just before the request to disconnect is made when the context is "plugins". */
	pluginScreenDisconnectCallback: PropTypes.func,
	/** A component to render as part of the disconnect step. */
	disconnectStepComponent: PropTypes.element,
	/** An object representing the connected user. */
	connectedUser: PropTypes.object,
	/** ID of the currently connected site. */
	connectedSiteId: PropTypes.number,
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
