/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import filesize from 'filesize';
import { PlaceholderWrapper } from '../../edit.js';
/**
 * Internal dependencies
 */
import UploadingEditor from './uploader-editor.js';

const UploaderProgress = ( { progress, file, paused, completed, onPauseOrResume, onDone } ) => {
	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${ roundedProgress }%` };

	const resumeText = __( 'Resume', 'jetpack' );
	const pauseText = __( 'Pause', 'jetpack' );
	const fileSizeLabel = filesize( file?.size );

	return (
		<PlaceholderWrapper disableInstructions>
			<UploadingEditor file={ file } />
			{ completed ? (
				<div className="uploader-block__upload-complete">
					<span>{ __( 'Upload Complete!', 'jetpack' ) } 🎉</span>
					<Button variant="primary" onClick={ onDone }>
						{ __( 'Done', 'jetpack' ) }
					</Button>
				</div>
			) : (
				<div className="videopress-uploader-progress">
					<div className="videopress-uploader-progress__file-info">
						<div className="videopress-uploader-progress__progress">
							<div className="videopress-uploader-progress__progress-loaded" style={ cssWidth } />
						</div>
						<div className="videopress-upload__percent-complete">
							{ sprintf(
								/* translators: Placeholder is an upload progress percenatage number, from 0-100. */
								__( 'Uploading (%1$s%%)', 'jetpack' ),
								roundedProgress
							) }
						</div>
						<div className="videopress-uploader-progress__file-size">{ fileSizeLabel }</div>
					</div>
					<div className="videopress-uploader-progress__actions">
						{ roundedProgress < 100 && (
							<Button variant="link" onClick={ onPauseOrResume }>
								{ paused ? resumeText : pauseText }
							</Button>
						) }
					</div>
				</div>
			) }
		</PlaceholderWrapper>
	);
};

export default UploaderProgress;
