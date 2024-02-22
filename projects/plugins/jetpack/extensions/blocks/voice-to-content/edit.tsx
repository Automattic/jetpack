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
import { createBlock } from '@wordpress/blocks';
import { Button, Modal, Icon, FormFileUpload } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import Oscilloscope from './components/oscilloscope';
import useTranscriptionInserter from './hooks/use-transcription-inserter';
/**
 * Types
 */
import type { CancelablePromise, RecordingState } from '@automattic/jetpack-ai-client';

function AudioStatusPanel( {
	state,
	error = null,
	analyser,
	duration = 0,
}: {
	state: RecordingState;
	error: string;
	analyser: AnalyserNode;
	duration: number;
} ) {
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
				<Oscilloscope analyser={ analyser } paused={ false } />
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
				<Oscilloscope analyser={ analyser } paused={ true } />
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

function ActionButtons( { state, mediaControls, onUpload, onCancelRecording } ) {
	const { start, pause, resume, stop, reset } = mediaControls ?? {};
	const cancelUpload = useRef( () => {} );

	const recordingHandler = useCallback( () => {
		if ( [ 'inactive', 'error' ].includes( state ) ) {
			start?.( 1000 ); // Stream audio on 1 second intervals
		} else if ( state === 'recording' ) {
			pause?.();
		} else if ( state === 'paused' ) {
			resume?.();
		}
	}, [ state, start, pause, resume ] );

	const doneHandler = useCallback( () => {
		stop?.();
	}, [ stop ] );

	const cancelHandler = () => {
		cancelUpload.current?.();
		onCancelRecording?.();
		reset?.();
	};

	const handleUpload = event => {
		const transcriptionProcess: CancelablePromise = onUpload( event );
		cancelUpload.current = () => {
			transcriptionProcess.canceled = true;
		};
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
					onChange={ handleUpload }
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

	const uploadHandler = event => {
		if ( event.currentTarget.files.length > 0 ) {
			onProcessing();
			const file = event.currentTarget.files[ 0 ];
			return transcribeAudio( file );
		}
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
								error={ error }
								duration={ duration }
								analyser={ analyser }
							/>
						</div>
						<ActionButtons
							state={ state }
							mediaControls={ controls }
							onUpload={ uploadHandler }
							onCancelRecording={ cancelRecording.current }
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
