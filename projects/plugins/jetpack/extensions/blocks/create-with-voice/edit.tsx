/**
 * External dependencies
 */
import { micIcon, playerPauseIcon, useMediaRecording } from '@automattic/jetpack-ai-client';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CreateWithVoiceEdit() {
	const { state, start, pause, stop, resume } = useMediaRecording( {
		onDone: blob => {
			console.log( 'Blob created: ', blob ); // eslint-disable-line no-console
		},
	} );

	const recordingHandler = useCallback( () => {
		if ( state === 'inactive' ) {
			start();
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
				label="AI: Create with voice"
				instructions={ __(
					'Transform your spoken words into publish-ready blocks with AI',
					'jetpack'
				) }
			>
				<div className="jetpack-ai-create-with-voice__recorder">
					<Button
						className="jetpack-ai-create-with-voice__record-button"
						icon={ state === 'recording' ? playerPauseIcon : micIcon }
						iconPosition="right"
						variant="primary"
						onClick={ recordingHandler }
					>
						{ buttonLabel }
					</Button>

					<Button
						className="jetpack-ai-create-with-voice__done-button"
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
