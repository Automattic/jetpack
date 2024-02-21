/**
 * External dependencies
 */
import {
	AudioDurationDisplay,
	micIcon,
	playerPauseIcon,
	useMediaRecording,
	useAudioTranscription,
	UseAudioTranscriptionReturn,
	useTranscriptionPostProcessing,
	TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT,
} from '@automattic/jetpack-ai-client';
import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal, Icon, FormFileUpload } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import oscilloscope from './assets/oscilloscope.svg';
import useTranscriptionInserter from './hooks/use-transcription-inserter';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Oscilloscope( { audioURL } ) {
	return <img src={ oscilloscope } alt="" />;
}

function AudioStatusPanel( { state, error = null, audioURL = null, duration = 0 } ) {
	if ( state === 'inactive' ) {
		return (
			<div className="jetpack-ai-voice-to-content__information">
				{ __( 'File size limit: 25MB. Recording time limit: 25 minutes.', 'jetpack' ) }
			</div>
		);
	}

	if ( state === 'recording' ) {
		return (
			<div className="jetpack-ai-voice-to-content__audio">
				<AudioDurationDisplay
					className="jetpack-ai-voice-to-content__audio--duration"
					duration={ duration }
				/>
				<Oscilloscope audioURL={ audioURL } />
				<span className="jetpack-ai-voice-to-content__information">
					{ __( 'Recording…', 'jetpack' ) }
				</span>
			</div>
		);
	}

	if ( state === 'paused' ) {
		return (
			<div className="jetpack-ai-voice-to-content__audio">
				<AudioDurationDisplay
					className="jetpack-ai-voice-to-content__audio--duration"
					duration={ duration }
				/>
				<Oscilloscope audioURL={ audioURL } />
				<span className="jetpack-ai-voice-to-content__information">
					{ __( 'Paused', 'jetpack' ) }
				</span>
			</div>
		);
	}

	if ( state === 'processing' ) {
		return (
			<div className="jetpack-ai-voice-to-content__information">
				{ __( 'Uploading and transcribing audio…', 'jetpack' ) }
			</div>
		);
	}

	if ( state === 'error' ) {
		return <div className="jetpack-ai-voice-to-content__information--error">{ error }</div>;
	}

	return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ActionButtons( { state, mediaControls, onError } ) {
	const { start, pause, resume, stop, reset } = mediaControls ?? {};
	const { upsertTranscription } = useTranscriptionInserter();

	const { processTranscription } = useTranscriptionPostProcessing( {
		feature: 'voice-to-content',
		onReady: postProcessingResult => {
			// Insert the content into the editor
			upsertTranscription( postProcessingResult );
		},
		onError: error => {
			// eslint-disable-next-line no-console
			console.log( 'Post-processing error: ', error );
		},
		onUpdate: currentPostProcessingResult => {
			/*
			 * We can upsert partial results because the hook take care of replacing
			 * the previous result with the new one.
			 */
			upsertTranscription( currentPostProcessingResult );
		},
	} );

	const onTranscriptionReady = ( transcription: string ) => {
		// eslint-disable-next-line no-console
		console.log( 'Transcription ready: ', transcription );
		processTranscription( TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT, transcription );
	};

	const onTranscriptionError = ( error: string ) => {
		// eslint-disable-next-line no-console
		console.log( 'Transcription error: ', error );
	};

	const { transcribeAudio }: UseAudioTranscriptionReturn = useAudioTranscription( {
		feature: 'voice-to-content',
		onReady: onTranscriptionReady,
		onError: onTranscriptionError,
	} );

	const recordingHandler = useCallback( () => {
		if ( [ 'inactive', 'error' ].includes( state ) ) {
			start?.( 1000 ); // Stream audio on 1 second intervals
		} else if ( state === 'recording' ) {
			pause?.();
		} else if ( state === 'paused' ) {
			resume?.();
		}
	}, [ state, start, pause, resume ] );

	const uploadHandler = event => {
		if ( event.currentTarget.files.length > 0 ) {
			const file = event.currentTarget.files[ 0 ];
			transcribeAudio( file );
		}
	};

	const doneHandler = useCallback( () => {
		stop?.();
	}, [ stop ] );

	const cancelHandler = () => {
		reset?.();
	};

	let buttonLabel = __( 'Begin recording', 'jetpack' );
	if ( state === 'recording' ) {
		buttonLabel = __( 'Pause recording', 'jetpack' );
	} else if ( state === 'paused' ) {
		buttonLabel = __( 'Resume recording', 'jetpack' );
	}

	return (
		<div className="jetpack-ai-voice-to-content__action-buttons">
			{ [ 'inactive', 'recording', 'paused', 'error' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					icon={ state === 'recording' ? playerPauseIcon : micIcon }
					variant="secondary"
					onClick={ recordingHandler }
				>
					{ buttonLabel }
				</Button>
			) }
			{ [ 'inactive', 'error' ].includes( state ) && (
				<FormFileUpload
					accept="audio/*"
					onChange={ uploadHandler }
					variant="secondary"
					className="jetpack-ai-voice-to-content__button"
				>
					{ __( 'Upload audio', 'jetpack' ) }
				</FormFileUpload>
			) }
			{ [ 'recording', 'paused' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="primary"
					onClick={ doneHandler }
				>
					{ __( 'Done', 'jetpack' ) }
				</Button>
			) }
			{ [ 'recording', 'paused', 'processing' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="secondary"
					onClick={ cancelHandler }
				>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			) }
		</div>
	);
}

export default function VoiceToContentEdit( { clientId } ) {
	const { state, controls, url, error, onError, duration } = useMediaRecording( {
		onDone: ( lastBlob, lastUrl ) => {
			console.log( 'Blob created: ', lastBlob, lastUrl ); // eslint-disable-line no-console
		},
	} );

	const dispatch = useDispatch( 'core/block-editor' );

	const destroyBlock = useCallback( () => {
		// Remove the block from the editor
		setTimeout( () => {
			dispatch.removeBlock( clientId );
		}, 100 );
	}, [ dispatch, clientId ] );

	const handleClose = () => {
		destroyBlock();
	};

	// To avoid a wrong TS warning
	const iconProps = { className: 'icon' };

	return (
		<Modal
			onRequestClose={ handleClose }
			title={ __( 'Jetpack AI Voice to content', 'jetpack' ) }
			className="jetpack-ai-voice-to-content__modal"
		>
			<ThemeProvider>
				<div className="jetpack-ai-voice-to-content__wrapper">
					<div className="jetpack-ai-voice-to-content__body">
						<span className="jetpack-ai-voice-to-content__description">
							{ __(
								'Transform your spoken words into a post ready to publish with AI.',
								'jetpack'
							) }
						</span>
						<div className="jetpack-ai-voice-to-content__contextual-row">
							<AudioStatusPanel
								state={ state }
								audioURL={ url }
								error={ error }
								duration={ duration }
							/>
						</div>
						<ActionButtons state={ state } mediaControls={ controls } onError={ onError } />
					</div>
					<div className="jetpack-ai-voice-to-content__footer">
						<Button
							variant="link"
							className="jetpack-ai-voice-to-content__feedback-button"
							href="https://a8c.slack.com/archives/C054LN8RNVA" // Jetpack AI Slack channel
							target="_blank"
						>
							<span>{ __( 'Provide feedback', 'jetpack' ) }</span>
							<Icon icon={ external } { ...iconProps } />
						</Button>
					</div>
				</div>
			</ThemeProvider>
		</Modal>
	);
}
