import jetpackAnalytics from '@automattic/jetpack-analytics';
import restApi from '@automattic/jetpack-api';
import { jetpackConfigHas, jetpackConfigGet } from '@automattic/jetpack-config';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useEffect, useCallback, useState } from 'react';
import useRestApiInit from '../../hooks/use-rest-api-init';
import './style.scss';
import StepDisconnect from './steps/step-disconnect';
import StepDisconnectConfirm from './steps/step-disconnect-confirm';
import StepSurvey from './steps/step-survey';
import StepThankYou from './steps/step-thank-you';
import type { MouseEvent, ReactElement } from 'react';

interface DisconnectDialogUser {
	/** The connected user's ID. */
	ID?: number | string;
	/** The connected user's login. */
	login?: string;
}

interface SurveyData {
	/** ID of the connected site. */
	site_id?: number;
	/** ID of the connected user. */
	user_id?: number | string;
	/** The survey identifier. */
	survey_id: string;
	/** The survey responses, keyed by question. */
	survey_responses: {
		'why-cancel': { response: string; text: string | null };
	};
}

interface TracksSurveyData {
	/** The context in which the dialog is being used. */
	context: string;
	/** The plugin initiating the disconnect. */
	plugin: string;
	/** The reason selected for disconnecting. */
	disconnect_reason: string;
}

interface DisconnectDialogProps {
	/** API root URL, required. */
	apiRoot: string;
	/** API Nonce, required. */
	apiNonce: string;
	/** The modal title. */
	title?: string;
	/** The callback to be called upon disconnection success. */
	onDisconnected?: () => void;
	/** The callback to be called upon disconnection failure. */
	onError?: ( error: unknown ) => void;
	/** The context in which this component is being used. */
	context?: string;
	/** Plugins that are using the Jetpack connection. */
	connectedPlugins?: Array< { name: string; slug: string } >;
	/** Callback called just before the disconnect request when the context is "plugins". */
	pluginScreenDisconnectCallback?: ( e?: MouseEvent< HTMLElement > ) => void;
	/** A component to render as part of the disconnect step. */
	disconnectStepComponent?: ReactElement;
	/** An object representing the connected user. */
	connectedUser?: DisconnectDialogUser;
	/** ID of the currently connected site. */
	connectedSiteId?: number;
	/** Whether any user on the site has a WordPress.com connection. Only used when the context is "plugins". */
	hasConnectedUser?: boolean;
	/** Whether or not the dialog modal should be open. */
	isOpen?: boolean;
	/** Callback function for when the modal closes. */
	onClose: () => void;
}

const SURVEY_SUBMIT_TIMEOUT_MS = 5000;

interface SurveyResponse {
	success: boolean;
	code?: string;
}

/**
 * The RNA Disconnect Dialog component.
 *
 * @param {DisconnectDialogProps} props -- The properties.
 * @return {import('react').ReactNode} The `DisconnectDialog` component.
 */
const DisconnectDialog = ( {
	apiRoot,
	apiNonce,
	connectedPlugins,
	title = __( 'Are you sure you want to disconnect?', 'jetpack-connection-js' ),
	pluginScreenDisconnectCallback,
	onDisconnected,
	onError,
	disconnectStepComponent,
	context = 'jetpack-dashboard',
	connectedUser = {}, // Pass empty object to avoid undefined errors.
	connectedSiteId,
	hasConnectedUser = true,
	isOpen,
	onClose,
}: DisconnectDialogProps ) => {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState< string | false >( false );
	const [ isProvidingFeedback, setIsProvidingFeedback ] = useState( false );
	const [ isFeedbackProvided, setIsFeedbackProvided ] = useState( false );
	const [ isSubmittingFeedback, setIsSubmittingFeedback ] = useState( false );

	let disconnectingPlugin = '';
	if ( jetpackConfigHas( 'consumer_slug' ) ) {
		disconnectingPlugin = jetpackConfigGet( 'consumer_slug' );
	}

	const defaultTracksArgs = useMemo( () => {
		return {
			context: context,
			plugin: disconnectingPlugin,
		};
	}, [ context, disconnectingPlugin ] );

	/**
	 * Initialize the REST API.
	 */
	useRestApiInit( apiRoot, apiNonce );

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
	 * Run when the disconnect dialog is opened
	 */
	useEffect( () => {
		if ( isOpen ) {
			jetpackAnalytics.tracks.recordEvent( 'jetpack_disconnect_dialog_open', defaultTracksArgs );
		}
	}, [ isOpen, defaultTracksArgs ] );

	/**
	 * Keep track of the steps that are presented
	 */
	useEffect( () => {
		// Don't do anything if the dialog is not open.
		if ( ! isOpen ) {
			return;
		}

		// On the plugins page the survey comes before deactivation, so check it before `isDisconnected`.
		if ( isProvidingFeedback && ! isFeedbackProvided ) {
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_disconnect_dialog_step',
				Object.assign( {}, { step: 'survey' }, defaultTracksArgs )
			);
		} else if ( ! isDisconnected ) {
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_disconnect_dialog_step',
				Object.assign( {}, { step: 'disconnect' }, defaultTracksArgs )
			);
		} else if ( isDisconnected && ! isProvidingFeedback && ! isFeedbackProvided ) {
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_disconnect_dialog_step',
				Object.assign( {}, { step: 'disconnect_confirm' }, defaultTracksArgs )
			);
		} else if ( isFeedbackProvided ) {
			jetpackAnalytics.tracks.recordEvent(
				'jetpack_disconnect_dialog_step',
				Object.assign( {}, { step: 'thank_you' }, defaultTracksArgs )
			);
		}
	}, [ isOpen, isDisconnected, isProvidingFeedback, isFeedbackProvided, defaultTracksArgs ] );

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
			.catch( ( error: unknown ) => {
				setIsDisconnecting( false );

				let message: string;
				if ( error instanceof Error && error.message ) {
					message = error.message;
				} else if ( typeof error === 'string' && error ) {
					message = error;
				} else {
					message = __(
						'There was a problem disconnecting your account. Please try again.',
						'jetpack-connection-js'
					);
				}
				setDisconnectError( message );

				if ( onError ) {
					onError( error );
				}
			} );
	}, [ setIsDisconnecting, setIsDisconnected, setDisconnectError, onError ] );

	/**
	 * Send a survey response and record the outcome in Tracks.
	 * Resolves either way: if the submission fails, there's nothing the user can do to fix it.
	 *
	 * @param {SurveyData}       surveyData       - The survey response payload.
	 * @param {TracksSurveyData} tracksSurveyData - Additional analytics data for the survey.
	 * @return {Promise<void>} Settles once the response is recorded or has failed.
	 */
	const sendSurvey = useCallback(
		( surveyData: SurveyData, tracksSurveyData: TracksSurveyData ) => {
			let request: Promise< SurveyResponse >;

			if ( context === 'plugins' && connectedUser.ID ) {
				// The site is still connected, so go through the authenticated proxy as the current user.
				request = restApi.submitSurvey( {
					site_id: surveyData.site_id,
					survey_id: surveyData.survey_id,
					survey_responses: surveyData.survey_responses,
				} );
			} else {
				// We cannot use `@wordpress/api-fetch` here since it unconditionally sends
				// the `X-WP-Nonce` header, which is disallowed by WordPress.com.
				request = fetch( 'https://public-api.wordpress.com/wpcom/v2/marketing/feedback-survey', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
					body: JSON.stringify( surveyData ),
				} ).then( result => result.json() as Promise< SurveyResponse > );
			}

			return request
				.then( jsonResponse => {
					if ( true !== jsonResponse?.success ) {
						throw new Error( 'Survey endpoint returned error code ' + jsonResponse?.code );
					}
					jetpackAnalytics.tracks.recordEvent(
						'jetpack_disconnect_survey_submit',
						tracksSurveyData
					);
				} )
				.catch( ( error: unknown ) => {
					jetpackAnalytics.tracks.recordEvent(
						'jetpack_disconnect_survey_error',
						Object.assign(
							{},
							{ error: error instanceof Error ? error.message : String( error ) },
							tracksSurveyData
						)
					);
				} );
		},
		[ context, connectedUser.ID ]
	);

	/**
	 * Submit the optional survey, then show the thank-you step or, on the plugins page, deactivate.
	 *
	 * @param {SurveyData}       surveyData       - The survey response payload.
	 * @param {TracksSurveyData} tracksSurveyData - Additional analytics data for the survey.
	 */
	const _submitSurvey = useCallback(
		( surveyData: SurveyData, tracksSurveyData: TracksSurveyData ) => {
			setIsSubmittingFeedback( true );

			if ( context === 'plugins' ) {
				// Don't let a slow response hold up deactivation.
				let timer: ReturnType< typeof setTimeout >;
				const timeout = new Promise< void >( resolve => {
					timer = setTimeout( resolve, SURVEY_SUBMIT_TIMEOUT_MS );
				} );
				Promise.race( [ sendSurvey( surveyData, tracksSurveyData ), timeout ] ).then( () => {
					clearTimeout( timer );
					pluginScreenDisconnectCallback?.();
				} );
				return;
			}

			sendSurvey( surveyData, tracksSurveyData ).then( () => {
				setIsFeedbackProvided( true );
				setIsSubmittingFeedback( false );
			} );
		},
		[
			context,
			sendSurvey,
			pluginScreenDisconnectCallback,
			setIsSubmittingFeedback,
			setIsFeedbackProvided,
		]
	);

	/**
	 * Do we have the necessary data to be able to submit a survey?
	 * Need the site ID, plus either a connected current user or, on the plugins page, a site no user ever connected.
	 */
	const canProvideFeedback = useCallback( () => {
		if ( ! connectedSiteId ) {
			return false;
		}
		if ( connectedUser.ID ) {
			return true;
		}
		return context === 'plugins' && ! hasConnectedUser;
	}, [ connectedUser, connectedSiteId, context, hasConnectedUser ] );

	/**
	 * Disconnect - Triggered upon clicking the 'Disconnect' button.
	 */
	const handleDisconnect = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();

			setDisconnectError( false );

			// On the plugins page, ask for feedback before deactivating, if the answer can be recorded.
			if ( context === 'plugins' && canProvideFeedback() ) {
				setIsProvidingFeedback( true );
				return;
			}

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
		[
			setDisconnectError,
			setIsDisconnecting,
			pluginScreenDisconnectCallback,
			context,
			canProvideFeedback,
			_disconnect,
		]
	);

	const trackModalClick = useCallback(
		( target: string ) => jetpackAnalytics.tracks.recordEvent( target, defaultTracksArgs ),
		[ defaultTracksArgs ]
	);

	/**
	 * Submit Survey - triggered by clicking on the "Submit Feedback" button.
	 * Assembles the survey response.
	 */
	const handleSubmitSurvey = useCallback(
		( surveyAnswerId: string, surveyAnswerText: string, e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();

			// We do not have the information needed to record the response.
			// return early and move to the last step in the flow anyway.
			if ( ! canProvideFeedback() ) {
				if ( context === 'plugins' ) {
					pluginScreenDisconnectCallback?.();
				} else {
					setIsFeedbackProvided( true );
				}
				return;
			}

			// Format the survey data for submission.
			const surveyData = {
				site_id: connectedSiteId,
				...( connectedUser.ID ? { user_id: connectedUser.ID } : {} ),
				survey_id: 'jetpack-plugin-disconnect',
				survey_responses: {
					'why-cancel': {
						response: surveyAnswerId,
						text: surveyAnswerText ? surveyAnswerText : null,
					},
				},
			};

			// Additional data for analytics to see where disconnections happened from.
			const tracksSurveyData = Object.assign( {}, defaultTracksArgs, {
				disconnect_reason: surveyAnswerId,
			} );

			_submitSurvey( surveyData, tracksSurveyData );
		},
		[
			_submitSurvey,
			setIsFeedbackProvided,
			canProvideFeedback,
			context,
			pluginScreenDisconnectCallback,
			connectedSiteId,
			connectedUser,
			defaultTracksArgs,
		]
	);

	/**
	 * Close modal and fire 'onDisconnected' callback if exists.
	 * Triggered upon clicking the 'Back To WordPress' button.
	 */
	const backToWordpress = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();

			if ( onDisconnected ) {
				onDisconnected();
			}

			onClose();
		},
		[ onDisconnected, onClose ]
	);

	/**
	 * Skip the survey on the plugins page and deactivate.
	 */
	const skipSurveyAndDeactivate = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();
			pluginScreenDisconnectCallback?.( e );
		},
		[ pluginScreenDisconnectCallback ]
	);

	/**
	 * Update the local state to show the survey step.
	 */
	const handleProvideFeedback = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			e && e.preventDefault();
			setIsProvidingFeedback( true );
		},
		[ setIsProvidingFeedback ]
	);

	/**
	 * Determine what step to show based on the current state
	 *
	 * @return { import('react').ReactNode } - component for current step
	 */
	const getCurrentStep = () => {
		if ( context === 'plugins' && isProvidingFeedback ) {
			return (
				<StepSurvey
					isSubmittingFeedback={ isSubmittingFeedback }
					onFeedBackProvided={ handleSubmitSurvey }
					onExit={ skipSurveyAndDeactivate }
					isBeforeDeactivation
					showConnectionOption={ ! hasConnectedUser }
				/>
			);
		}

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
					trackModalClick={ trackModalClick }
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
			return (
				<StepSurvey
					isSubmittingFeedback={ isSubmittingFeedback }
					onFeedBackProvided={ handleSubmitSurvey }
					onExit={ backToWordpress }
				/>
			);
		} else if ( isFeedbackProvided ) {
			return <StepThankYou onExit={ backToWordpress } />;
		}

		return undefined;
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

export default DisconnectDialog;
