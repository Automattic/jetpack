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
} from '@automattic/jetpack-ai-client';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button, FormFileUpload } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';

function AudioPlayer( { src, state } ) {
	if ( ! src ) {
		return null;
	}

	if ( state !== 'inactive' ) {
		return null;
	}

	return <audio controls src={ src } />; // eslint-disable-line jsx-a11y/media-has-caption
}

/**
 * A simple component to display the transcription hook usage.
 * @returns {React.ReactNode} The transcription demo component.
 */
function AudioTranscriptionDemo() {
	const {
		transcribeAudio,
		isTranscribingAudio,
		transcriptionResult,
		transcriptionError,
	}: UseAudioTranscriptionReturn = useAudioTranscription( 'voice-to-content' );

	/**
	 * File change handler for the file upload.
	 */
	const onFileChange = useCallback(
		event => {
			if ( event.currentTarget.files.length > 0 ) {
				transcribeAudio( event.currentTarget.files[ 0 ] );
			}
		},
		[ transcribeAudio ]
	);

	return (
		<div className="jetpack-ai-voice-to-content__uploader">
			<hr />
			<p>{ __( 'Pick a file for testing the transcription:', 'jetpack' ) }</p>
			<FormFileUpload accept="audio/*" onChange={ onFileChange } variant="primary">
				{ __( 'Upload Audio', 'jetpack' ) }
			</FormFileUpload>
			{ isTranscribingAudio && <p>{ __( 'Processing the transcription…', 'jetpack' ) }</p> }
			{ transcriptionError && (
				<p>
					{ __( 'Error', 'jetpack' ) }: { transcriptionError }
				</p>
			) }
			{ transcriptionResult && (
				<p>
					{ __( 'Result', 'jetpack' ) }: <br />
					<br />
					{ transcriptionResult }
				</p>
			) }
		</div>
	);
}

export default function VoiceToContentEdit() {
	const { state, start, pause, stop, resume, url } = useMediaRecording( {
		onDone: blob => {
			console.log( 'Blob created: ', blob ); // eslint-disable-line no-console
		},
	} );

	const recordingHandler = useCallback( () => {
		if ( state === 'inactive' ) {
			start( 1000 ); // stream audio every second
		} else if ( state === 'recording' ) {
			pause();
		} else if ( state === 'paused' ) {
			resume();
		}
	}, [ state, start, pause, resume ] );

	let buttonLabel = __( 'Begin recording', 'jetpack' );
	if ( state === 'recording' ) {
		buttonLabel = __( 'Pause recording', 'jetpack' );
	} else if ( state === 'paused' ) {
		buttonLabel = __( 'Resume recording', 'jetpack' );
	}

	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<Placeholder
				icon="microphone"
				label="AI: Voice to content"
				instructions={ __(
					'Transform your spoken words into publish-ready content with AI.',
					'jetpack'
				) }
				className="jetpack-ai-voice-to-content"
			>
				<div className="jetpack-ai-voice-to-content__player">
					<strong>
						<AudioDurationDisplay url={ url } />
					</strong>
					<AudioPlayer state={ state } src={ url } />
				</div>

				<div className="jetpack-ai-voice-to-content__recorder">
					<Button
						className="jetpack-ai-voice-to-content__record-button"
						icon={ state === 'recording' ? playerPauseIcon : micIcon }
						iconPosition="right"
						variant="primary"
						onClick={ recordingHandler }
					>
						{ buttonLabel }
					</Button>
					<Button
						className="jetpack-ai-voice-to-content__done-button"
						variant="primary"
						onClick={ stop }
						disabled={ state === 'inactive' }
					>
						{ __( 'Done', 'jetpack' ) }
					</Button>
				</div>
				<AudioTranscriptionDemo />
			</Placeholder>
		</div>
	);
}
