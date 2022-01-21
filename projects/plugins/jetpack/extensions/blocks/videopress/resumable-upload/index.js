/**
 * Internal Dependencies
 */
 import filesize from 'filesize';

/**
 * WordPress dependencies
 */
 import { __, sprintf } from '@wordpress/i18n';
 import { createInterpolateElement } from '@wordpress/element';
 import { escapeHTML } from '@wordpress/escape-html';
 import { getJWT, useUploader } from './use-uploader';
 /*import apiFetch from '@wordpress/api-fetch';
 import { __, sprintf } from '@wordpress/i18n';

 import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
 import { upload } from '@wordpress/icons';
 import { useSelect } from '@wordpress/data';*/
 import { useEffect, useState } from '@wordpress/element';

import {
    Button,
	Icon
} from '@wordpress/components';

import { VideoPressIcon } from '../../../shared/icons';
import './style.scss';

export default function ResumableUpload( { file } ) {
	if ( ! file ) {
		return null;
	}

	const [ progress, setProgress ] = useState( 0 );
	const [ hasPaused, setHasPaused ] = useState( false );
	const [ tusUploader, setTusUploader ] = useState( null );

	const onError = ( error ) => { console.log( 'I failed', error ); };

	const onProgress = ( bytesUploaded, bytesTotal ) => {
		const percentage = ( bytesUploaded / bytesTotal ) * 100;
		setProgress( percentage );
		console.log( percentage );
	};

	const onSuccess = () => {
		console.log( 'SUCCESS' );
		// TODO: Load video? (Conversion screen) Need the guid
	};

	useEffect(() => {
		const uploader = useUploader( {
			onError,
			onProgress,
			onSuccess,
		} );

		// Kicks things off.
		getJWT().then( ( jwtData ) => {
			const newUploader = uploader( file, jwtData );
			setTusUploader( newUploader );
		} );
	}, []);

	console.log( tusUploader );
	if ( null === tusUploader ) {
		return (
			<div className="wp-block resumable-upload">Just a wee sec...</div>
		);
	}

	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${roundedProgress}%` };

	const pauseOrResumeUpload = () => {
		if ( tusUploader ) {
			if ( hasPaused ) {
				tusUploader.start();
			} else {
				tusUploader.abort();
			}
			setHasPaused( ! hasPaused );
		}
	};

	const escapedFileName = escapeHTML( file.name );
	const fileNameLabel = createInterpolateElement(
		sprintf(
			/* translators: Placeholder is a video file name. */
			__(
				'Uploading <strong>%s</strong>',
				escapedFileName,
				'jetpack'
			),
			escapedFileName
		),
		{ strong: <strong /> }
	)

	const fileSizeLabel = filesize( file.size );

    return (
        <div className="wp-block resumable-upload">
			<div className="resumable-upload__logo">
				<Icon icon={ VideoPressIcon } />
				<div className="resumable-upload__logo-text">{ __( 'Video', 'jetpack' ) }</div>
			</div>
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
		</div>
    );
}

