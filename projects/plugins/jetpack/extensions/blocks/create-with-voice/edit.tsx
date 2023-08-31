/**
 * External dependencies
 */
import { micIcon, playerStopIcon, useMediaRecording } from '@automattic/jetpack-ai-client';
import { Placeholder, Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CreateWithVoiceEdit() {
	const { state, start, pause, resume } = useMediaRecording();

	const recordingHandler = useCallback( () => {
		if ( state === 'inactive' ) {
			start();
		} else if ( state === 'recording' ) {
			pause();
		} else if ( state === 'paused' ) {
			resume();
		}
	}, [ state, start, pause, resume ] );

	let buttoneLabel = __( 'Start recording', 'jetpack' );
	if ( state === 'recording' ) {
		buttoneLabel = __( 'Pause recording', 'jetpack' );
	} else if ( state === 'paused' ) {
		buttoneLabel = __( 'Resume recording', 'jetpack' );
	}

	return (
		<Placeholder
			icon="microphone"
			label="AI: Create with voice"
			instructions={ __(
				'Transform your spoken words into publish-ready blocks with AI',
				'jetpack'
			) }
		>
			<Button
				className="jetpack-ai-create-with-voice__record-button"
				icon={ state === 'recording' ? playerStopIcon : micIcon }
				variant="primary"
				onClick={ recordingHandler }
			>
				{ buttoneLabel }
			</Button>
		</Placeholder>
	);
}
