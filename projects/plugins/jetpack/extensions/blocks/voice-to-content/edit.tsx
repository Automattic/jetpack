/**
 * External dependencies
 */
import {
	useMediaRecording,
	useAudioTranscription,
	UseAudioTranscriptionReturn,
	useTranscriptionPostProcessing,
	TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT,
} from '@automattic/jetpack-ai-client';
import { ThemeProvider } from '@automattic/jetpack-components';
import { createBlock } from '@wordpress/blocks';
import { Button, Modal, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ActionButtons from './components/action-buttons';
import AudioStatusPanel from './components/audio-status-panel';
import useTranscriptionInserter from './hooks/use-transcription-inserter';

export default function VoiceToContentEdit( { clientId } ) {
	const dispatch: {
		removeBlock: ( id: number ) => void;
		insertBlock: ( block: object ) => void;
	} = useDispatch( 'core/block-editor' );
	const transcription = useRef( null );

	const destroyBlock = useCallback( () => {
		// Remove the block from the editor
		setTimeout( () => {
			dispatch.removeBlock( clientId );
		}, 100 );
	}, [ dispatch, clientId ] );

	const handleClose = () => {
		destroyBlock();
	};

	const { upsertTranscription } = useTranscriptionInserter();

	const { processTranscription, cancelTranscriptionProcessing, isProcessingTranscription } =
		useTranscriptionPostProcessing( {
			feature: 'voice-to-content',
			onReady: postProcessingResult => {
				// Insert the content into the editor
				upsertTranscription( postProcessingResult );
				handleClose();
			},
			onError: error => {
				// Use the transcription instead for a partial result
				if ( transcription.current ) {
					dispatch.insertBlock(
						createBlock( 'core/paragraph', { content: transcription.current } )
					);
				}
				// eslint-disable-next-line no-console
				console.log( 'Post-processing error: ', error );
				handleClose();
			},
			onUpdate: currentPostProcessingResult => {
				/*
				 * We can upsert partial results because the hook takes care of replacing
				 * the previous result with the new one.
				 */
				upsertTranscription( currentPostProcessingResult );
			},
		} );

	const onTranscriptionReady = ( content: string ) => {
		// eslint-disable-next-line no-console
		console.log( 'Transcription ready: ', content );
		transcription.current = content;
		processTranscription( TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT, content );
	};

	const onTranscriptionError = ( error: string ) => {
		onError( error );
	};

	const { transcribeAudio, cancelTranscription, isTranscribingAudio }: UseAudioTranscriptionReturn =
		useAudioTranscription( {
			feature: 'voice-to-content',
			onReady: onTranscriptionReady,
			onError: onTranscriptionError,
		} );

	const isCreatingTranscription = isTranscribingAudio || isProcessingTranscription;

	const { state, controls, error, onError, duration, analyser } = useMediaRecording( {
		onDone: lastBlob => {
			// When recording is done, set the audio to be transcribed
			onAudioHandler( lastBlob );
		},
	} );

	const onAudioHandler = useCallback(
		( audio: Blob ) => {
			if ( audio ) {
				transcribeAudio( audio );
			}
		},
		[ transcribeAudio ]
	);

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
		cancelTranscriptionProcessing();
		controlReset();
	}, [ cancelTranscription, cancelTranscriptionProcessing, controlReset ] );

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

	const transcriptionState = isCreatingTranscription ? 'processing' : state;

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
