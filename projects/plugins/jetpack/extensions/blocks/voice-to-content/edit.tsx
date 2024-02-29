/**
 * External dependencies
 */
import {
	useMediaRecording,
	useAudioValidation,
	RecordingState,
	TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT,
	TranscriptionState,
} from '@automattic/jetpack-ai-client';
import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Modal, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ActionButtons from './components/action-buttons';
import AudioStatusPanel from './components/audio-status-panel';
import useTranscriptionCreator from './hooks/use-transcription-creator';
import useTranscriptionInserter from './hooks/use-transcription-inserter';

/**
 * Helper to determine the state of the transcription.
 *
 * @param {boolean} isCreatingTranscription - The transcription creation state
 * @param {boolean} isValidatingAudio - The audio validation state
 * @param {RecordingState} recordingState - The recording state
 * @returns {TranscriptionState} - The transcription state
 */
const transcriptionStateHelper = (
	isCreatingTranscription: boolean,
	isValidatingAudio: boolean,
	recordingState: RecordingState
): TranscriptionState => {
	if ( isValidatingAudio ) {
		return 'validating';
	}

	if ( isCreatingTranscription ) {
		return 'processing';
	}

	return recordingState;
};

export default function VoiceToContentEdit( { clientId } ) {
	const [ audio, setAudio ] = useState< Blob >( null );

	const dispatch: {
		removeBlock: ( id: number ) => void;
	} = useDispatch( 'core/block-editor' );

	const destroyBlock = useCallback( () => {
		// Remove the block from the editor
		setTimeout( () => {
			dispatch.removeBlock( clientId );
		}, 100 );
	}, [ dispatch, clientId ] );

	const handleClose = () => {
		destroyBlock();
	};

	const { isValidatingAudio, validateAudio } = useAudioValidation();

	const { upsertTranscription } = useTranscriptionInserter();
	const { isCreatingTranscription, createTranscription, cancelTranscription } =
		useTranscriptionCreator( {
			onReady: ( content: string ) => {
				// When transcription is ready, insert it into the editor
				upsertTranscription( content );
				handleClose();
			},
			onUpdate: ( content: string ) => {
				// When transcription is updated, insert it into the editor
				upsertTranscription( content );
			},
			onError: ( error: string ) => {
				// When transcription fails, show an error message
				onError( error );
			},
		} );

	const { state, controls, error, onError, duration, analyser } = useMediaRecording( {
		onDone: lastBlob => {
			// When recording is done, set the audio to be transcribed
			onAudioHandler( lastBlob );
		},
	} );

	const onAudioHandler = useCallback(
		( audioFile: Blob ) => {
			if ( audioFile ) {
				setAudio( audioFile );
			}
		},
		[ setAudio ]
	);

	/**
	 * When the audio changes, create the transcription. In the future,
	 * we can trigger this action (and others) from a button in the UI.
	 */
	useEffect( () => {
		if ( audio ) {
			validateAudio(
				audio,
				() => {
					createTranscription( audio, TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT );
				},
				onError
			);
		}
	}, [ audio, validateAudio, createTranscription, onError ] );

	// Destructure controls
	const {
		start: controlStart,
		pause: controlPause,
		resume: controlResume,
		stop: controlStop,
		reset: controlReset,
	} = controls;

	const onUploadHandler = useCallback(
		event => {
			if ( event.currentTarget.files.length > 0 ) {
				const file = event.currentTarget.files[ 0 ];
				onAudioHandler( file );
			}
		},
		[ onAudioHandler ]
	);

	const onCancelHandler = useCallback( () => {
		cancelTranscription();
		controlReset();
	}, [ cancelTranscription, controlReset ] );

	const onRecordHandler = useCallback( () => {
		controlStart( 1000 ); // Stream audio on 1 second intervals
	}, [ controlStart ] );

	const onPauseHandler = useCallback( () => {
		controlPause();
	}, [ controlPause ] );

	const onResumeHandler = useCallback( () => {
		controlResume();
	}, [ controlResume ] );

	const onDoneHandler = useCallback( () => {
		controlStop();
	}, [ controlStop ] );

	// To avoid a wrong TS warning
	const iconProps = { className: 'icon' };

	const transcriptionState = transcriptionStateHelper(
		isCreatingTranscription,
		isValidatingAudio,
		state
	);

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
								state={ transcriptionState }
								error={ error }
								duration={ duration }
								analyser={ analyser }
							/>
						</div>
						<ActionButtons
							state={ transcriptionState }
							onUpload={ onUploadHandler }
							onCancel={ onCancelHandler }
							onRecord={ onRecordHandler }
							onPause={ onPauseHandler }
							onResume={ onResumeHandler }
							onDone={ onDoneHandler }
						/>
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
