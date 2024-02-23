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
import { useCallback, useRef, useState } from '@wordpress/element';
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
	const cancelRecording = useRef( () => {} );
	const [ transcription, setTranscription ] = useState( null );

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

	const { processTranscription } = useTranscriptionPostProcessing( {
		feature: 'voice-to-content',
		onReady: postProcessingResult => {
			// Insert the content into the editor
			upsertTranscription( postProcessingResult );
			handleClose();
		},
		onError: error => {
			// Use the transcription instead for a partial result
			if ( transcription ) {
				dispatch.insertBlock( createBlock( 'core/paragraph', { content: transcription } ) );
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
		setTranscription( content );
		processTranscription( TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT, content );
	};

	const onTranscriptionError = ( error: string ) => {
		onError( error );
	};

	const { transcribeAudio }: UseAudioTranscriptionReturn = useAudioTranscription( {
		feature: 'voice-to-content',
		onReady: onTranscriptionReady,
		onError: onTranscriptionError,
	} );

	const { state, controls, error, onError, onProcessing, duration, analyser } = useMediaRecording( {
		onDone: lastBlob => {
			const promise = transcribeAudio( lastBlob );
			cancelRecording.current = () => {
				promise.canceled = true;
			};
		},
	} );

	const onUploadHandler = useCallback(
		event => {
			if ( event.currentTarget.files.length > 0 ) {
				onProcessing();
				const file = event.currentTarget.files[ 0 ];
				return transcribeAudio( file );
			}
		},
		[ onProcessing, transcribeAudio ]
	);

	const onRecordHandler = useCallback( () => {
		controls.start( 1000 ); // Stream audio on 1 second intervals
	}, [ controls ] );

	const onPauseHandler = useCallback( () => {
		controls.pause();
	}, [ controls ] );

	const onResumeHandler = useCallback( () => {
		controls.resume();
	}, [ controls ] );

	const onDoneHandler = useCallback( () => {
		controls.stop();
	}, [ controls ] );

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
								error={ error }
								duration={ duration }
								analyser={ analyser }
							/>
						</div>
						<ActionButtons
							state={ state }
							mediaControls={ controls }
							onUpload={ onUploadHandler }
							onCancelRecording={ cancelRecording.current }
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
