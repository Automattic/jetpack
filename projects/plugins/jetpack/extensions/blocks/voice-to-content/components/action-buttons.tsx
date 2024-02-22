/**
 * External dependencies
 */
import { micIcon, playerPauseIcon } from '@automattic/jetpack-ai-client';
import { Button, FormFileUpload } from '@wordpress/components';
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { CancelablePromise } from '@automattic/jetpack-ai-client';

export default function ActionButtons( { state, mediaControls, onUpload, onCancelRecording } ) {
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
