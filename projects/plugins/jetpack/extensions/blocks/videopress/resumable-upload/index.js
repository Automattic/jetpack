/**
 * WordPress dependencies
 */
 import { __, sprintf } from '@wordpress/i18n';
 import { createInterpolateElement } from '@wordpress/element';
 /*import apiFetch from '@wordpress/api-fetch';
 import { __, sprintf } from '@wordpress/i18n';

 import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
 import { upload } from '@wordpress/icons';
 import { useSelect } from '@wordpress/data';
 import { useState } from '@wordpress/element';*/

import {
    Button,
	Icon
} from '@wordpress/components';

import { VideoPressIcon } from '../../../shared/icons';
import './style.scss';

 export default function ResumableUpload( { tracks = [], onChange, guid } ) {
    const progress = 50.3;
    const roundedProgress = 50;

    const pauseOrResumeUpload = () => {};
    const hasPaused = false;
    const cssWidth = { width: `${roundedProgress}%` };

	const fileNameLabel = createInterpolateElement(
		sprintf(
			/* translators: Placeholder is a video file name. */
			__(
				'Uploading <strong>%s</strong>',
				'red-line.mp4',
				'jetpack'
			),
			'red-line.mp4'
		),
		{ strong: <strong /> }
	)
	
	const fileSizeLabel = `${148.7}MB`;

    return (
        <div className="wp-block resumable-upload">
			<div className="resumable-upload__logo">
				<Icon icon={ VideoPressIcon } />
				<div className="resumable-upload__logo-text">{ __( 'Video', 'jetpack' ) }</div>
			</div>
			{ progress > 0 && (
				<div className="resumable-upload__status">
					<div className="resumable-upload__file-info">
						<div className="resumable-upload__file-name">{ fileNameLabel }</div>
						<div className="resumable-upload__file-size">{ fileSizeLabel }</div>
					</div>
					<div className="resumable-upload__progress">
						<div className="resumable-upload__progress-loaded" style={ cssWidth } />
					</div>
					<div className="resumable-upload__actions">
							<div className="videopress-upload__percent-complete">{ `${roundedProgress}%` }</div>
							<Button
								isLink
								onClick={ () => pauseOrResumeUpload() }>
									{ hasPaused ? 'Resume' : 'Pause' }
							</Button>
						</div>
				</div>
			) }
		</div>
    );
}
 
 