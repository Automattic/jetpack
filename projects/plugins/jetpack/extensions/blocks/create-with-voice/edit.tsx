/**
 * External dependencies
 */
import { micIcon, playerStopIcon, useMediaRecording } from '@automattic/jetpack-ai-client';
import { useBlockProps } from '@wordpress/block-editor';
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

	let buttonLabel = __( 'Start recording', 'jetpack' );
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
					{ buttonLabel }
				</Button>
			</Placeholder>
		</div>
	);
}
