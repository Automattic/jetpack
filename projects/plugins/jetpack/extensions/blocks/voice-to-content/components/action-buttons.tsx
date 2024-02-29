/**
 * External dependencies
 */
import { micIcon, playerPauseIcon } from '@automattic/jetpack-ai-client';
import { Button, FormFileUpload } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function ActionButtons( {
	state,
	onUpload,
	onCancel,
	onRecord,
	onPause,
	onResume,
	onDone,
} ) {
	return (
		<div className="jetpack-ai-voice-to-content__action-buttons">
			{ [ 'inactive', 'error', 'validating' ].includes( state ) && (
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
			{ [ 'inactive', 'error', 'validating' ].includes( state ) && (
				<FormFileUpload
					accept="audio/*"
					onChange={ onUpload }
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
