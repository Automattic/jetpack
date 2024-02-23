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

export default function ActionButtons( {
	state,
	mediaControls,
	onUpload,
	onCancelRecording,
	onRecord,
	onPause,
} ) {
	const { resume, stop, reset } = mediaControls ?? {};
	const cancelUpload = useRef( () => {} );

	const onResume = useCallback( () => {
		resume?.();
	}, [ resume ] );

	const onDone = useCallback( () => {
		stop?.();
	}, [ stop ] );

	const onCancel = () => {
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

	return (
		<div className="jetpack-ai-voice-to-content__action-buttons">
			{ [ 'inactive', 'error' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					icon={ micIcon }
					variant="secondary"
					onClick={ onRecord }
				>
					{ __( 'Begin recording', 'jetpack' ) }
				</Button>
			) }
			{ [ 'recording' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					icon={ playerPauseIcon }
					variant="secondary"
					onClick={ onPause }
				>
					{ __( 'Pause recording', 'jetpack' ) }
				</Button>
			) }
			{ [ 'paused' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					icon={ micIcon }
					variant="secondary"
					onClick={ onResume }
				>
					{ __( 'Resume recording', 'jetpack' ) }
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
					onClick={ onDone }
				>
					{ __( 'Done', 'jetpack' ) }
				</Button>
			) }
			{ [ 'recording', 'paused', 'processing' ].includes( state ) && (
				<Button
					className="jetpack-ai-voice-to-content__button"
					variant="secondary"
					onClick={ onCancel }
				>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			) }
		</div>
	);
}
