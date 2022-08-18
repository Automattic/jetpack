/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import filesize from 'filesize';
import { PlaceholderWrapper } from '../../edit.js';
/**
 * Internal dependencies
 */
import usePosterUpload from '../../hooks/use-poster-upload.js';
import UploadingEditor from './uploader-editor.js';

const UploaderProgress = ( {
	attributes,
	setAttributes,
	progress,
	file,
	paused,
	completed,
	onPauseOrResume,
	onDone,
} ) => {
	const [ videoPosterImageData, setVideoPosterImageData ] = useState( null );
	const videoPressUploadPoster = usePosterUpload();

	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${ roundedProgress }%` };
	const resumeText = __( 'Resume', 'jetpack' );
	const pauseText = __( 'Pause', 'jetpack' );
	const fileSizeLabel = filesize( file?.size );
	const guid = attributes?.guid;

	const handleSelectPoster = image => {
		setVideoPosterImageData( image );
	};

	const handleRemovePoster = () => {
		setVideoPosterImageData( null );
	};

	const shouldUseJetpackVideoFetch = () => {
		return 'videoPressUploadPoster' in window;
	};

	const getPosterImage = () => {
		if ( shouldUseJetpackVideoFetch() ) {
			return window.videoPressGetPoster( guid );
		}

		return apiFetch( {
			path: `/videos/${ guid }/poster`,
			apiNamespace: 'rest/v1.1',
			global: true,
			method: 'GET',
		} );
	};

	const startPollingForPosterImage = () => {
		setTimeout( () => {
			getPosterImage().then( result => updatePosterFromApiResult( result ) );
		}, 2000 );
	};

	const updatePosterImage = newPosterImage => {
		if ( newPosterImage ) {
			setAttributes( { poster: newPosterImage } );
		}
	};

	const updatePosterFromApiResult = result => {
		if ( result.generating ) {
			startPollingForPosterImage();
		} else {
			updatePosterImage( result.poster );
		}
	};

	const sendUpdatePoster = data => {
		return new Promise( ( resolve, reject ) => {
			videoPressUploadPoster( guid, data )
				.then( result => {
					updatePosterFromApiResult( result );
					resolve();
				} )
				.catch( () => {
					apiFetch( {
						path: `/videos/${ guid }/poster`,
						apiNamespace: 'rest/v1.1',
						method: 'POST',
						global: true,
						data: data,
					} )
						.then( () => {
							resolve();
						} )
						.catch( e => {
							reject( e );
						} );
				} );
		} );
	};

	const handleDoneUpload = () => {
		// const { title, videoFrameSelectedInMillis } = this.state;

		// if ( title ) {
		// sendUpdateTitleRequest();
		// }

		if ( videoPosterImageData ) {
			sendUpdatePoster( { poster_attachment_id: videoPosterImageData?.id } ).then( () => {
				onDone();
			} );
			return;
		}

		// if (
		// // Check if videoFrameSelectedInMillis is not undefined or null instead of bool check to allow 0ms. selection
		// 'undefined' !== typeof videoFrameSelectedInMillis &&
		// null !== videoFrameSelectedInMillis
		// ) {
		// sendUpdatePosterFromMillisecondsRequest();
		// }
	};

	return (
		<PlaceholderWrapper disableInstructions>
			<UploadingEditor
				file={ file }
				onSelectPoster={ handleSelectPoster }
				onRemovePoster={ handleRemovePoster }
				videoPosterImageData={ videoPosterImageData }
			/>
			{ completed ? (
				<div className="uploader-block__upload-complete">
					<span>{ __( 'Upload Complete!', 'jetpack' ) } 🎉</span>
					<Button variant="primary" onClick={ handleDoneUpload }>
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
