/**
 * External dependencies
 */
import {
	AudioDurationDisplay,
	micIcon,
	playerPauseIcon,
	useMediaRecording,
} from '@automattic/jetpack-ai-client';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function AudioPlayer( { src, state } ) {
	if ( ! src ) {
		return null;
	}

	if ( state !== 'inactive' ) {
		return null;
	}

	return <audio controls src={ src } />; // eslint-disable-line jsx-a11y/media-has-caption
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
			</Placeholder>
		</div>
	);
}
