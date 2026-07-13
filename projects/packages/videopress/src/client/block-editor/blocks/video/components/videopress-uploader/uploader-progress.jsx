/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, TextControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';
import debugFactory from 'debug';
import { filesize } from 'filesize';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../../../hooks/use-meta-update.js';
import usePosterImage from '../../../../../hooks/use-poster-image.js';
import usePosterUpload from '../../../../../hooks/use-poster-upload.js';
import { removeFileNameExtension } from '../../../../../lib/url';
import { PlaceholderWrapper } from '../../edit';
import UploadingEditor from './uploader-editor.jsx';

const debug = debugFactory( 'videopress:block:uploader' );

/**
 * Captures the current frame from a video element as a JPEG blob.
 *
 * @param {HTMLVideoElement} video - The video element to capture from.
 * @return {Promise<Blob>} A promise that resolves with the JPEG blob.
 */
const captureVideoFrame = video => {
	return new Promise( ( resolve, reject ) => {
		const canvas = document.createElement( 'canvas' );
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		const context = canvas.getContext( '2d' );
		if ( ! context ) {
			reject( new Error( 'Could not get 2D context for canvas' ) );
			return;
		}

		try {
			context.drawImage( video, 0, 0 );
		} catch ( error ) {
			reject(
				error instanceof Error ? error : new Error( 'Failed to draw video frame to canvas' )
			);
			return;
		}

		canvas.toBlob(
			blob => ( blob ? resolve( blob ) : reject( new Error( 'toBlob failed' ) ) ),
			'image/jpeg',
			0.95
		);
	} );
};

const usePosterAndTitleUpdate = ( { setAttributes, videoData, onDone } ) => {
	const [ isFinishingUpdate, setIsFinishingUpdate ] = useState( false );
	const [ videoFrameMs, setVideoFrameMs ] = useState( null );
	const [ videoPosterImageData, setVideoPosterImageData ] = useState( null );
	const { title } = videoData;

	const guid = videoData?.guid;
	const videoPressUploadPoster = usePosterUpload( guid );
	const videoPressGetPoster = usePosterImage( guid );
	const updateMeta = useMetaUpdate( videoData?.id );

	const getPosterImage = () => {
		return new Promise( ( resolve, reject ) => {
			videoPressGetPoster( guid )
				.then( response => resolve( response ) )
				.catch( () => {
					apiFetch( {
						path: `/videos/${ guid }/poster`,
						apiNamespace: 'rest/v1.1',
						global: true,
						method: 'GET',
					} )
						.then( response => resolve( response ) )
						.catch( e => reject( e ) );
				} );
		} );
	};

	const updatePoster = ( { data: result }, remainingRetries = 10 ) => {
		return new Promise( resolve => {
			// Check for a poster URL first — the API can return both
			// `poster` and `generating: true` simultaneously.
			if ( result?.poster ) {
				setAttributes( { poster: result.poster } );
				resolve( result.poster );
			} else if ( result?.generating && remainingRetries > 0 ) {
				setTimeout( () => {
					getPosterImage()
						.then( response => updatePoster( response, remainingRetries - 1 ).then( resolve ) )
						.catch( error => {
							debug( 'Poster polling failed: %o', error );
							resolve( null );
						} );
				}, 2000 );
			} else {
				if ( result?.generating ) {
					debug( 'Poster generation polling timed out' );
				}
				resolve( null );
			}
		} );
	};

	const sendUpdatePoster = data => {
		return new Promise( ( resolve, reject ) => {
			videoPressUploadPoster( data )
				.then( result => {
					updatePoster( result ).then( resolve );
				} )
				.catch( () => {
					apiFetch( {
						path: `/videos/${ guid }/poster`,
						apiNamespace: 'rest/v1.1',
						method: 'POST',
						global: true,
						data: data,
					} )
						.then( result => {
							updatePoster( { data: result } ).then( resolve );
						} )
						.catch( e => {
							reject( e );
						} );
				} );
		} );
	};

	const posterPromiseRef = useRef( null );
	const videoRef = useRef( null );

	const debouncedSendUpdatePoster = useDebounce( posterData => {
		posterPromiseRef.current = sendUpdatePoster( posterData );
	}, 1000 );

	const sendUpdateTitleRequest = () => {
		return updateMeta( { title } );
	};

	const handleSelectPoster = image => {
		setVideoPosterImageData( image );
	};

	const handleRemovePoster = () => {
		setVideoPosterImageData( null );
	};

	const handleVideoFrameSelected = ms => {
		setVideoFrameMs( ms );
		setVideoPosterImageData( null );
		posterPromiseRef.current = null;
	};

	const handleDoneUpload = () => {
		if ( ! guid ) {
			return;
		}

		setIsFinishingUpdate( true );
		debouncedSendUpdatePoster.cancel?.();

		if ( title ) {
			sendUpdateTitleRequest().catch( error => {
				debug( 'Failed to update video title: %o', error );
			} );
		}

		// Image selection: we have the URL client-side, fire the server
		// update in the background and proceed immediately.
		if ( videoPosterImageData ) {
			sendUpdatePoster( {
				poster_attachment_id: videoPosterImageData?.id,
			} ).catch( error => {
				debug( 'Failed to update poster in background: %o', error );
			} );
			onDone( {
				...videoData,
				poster: videoPosterImageData.url,
			} );
			return;
		}

		// Frame selection: capture the frame client-side from the video
		// element and upload it to the WP Media Library as an attachment.
		// The attachment URL is used directly as the poster, bypassing
		// the VideoPress poster API. This avoids depending on server-side
		// frame extraction which requires the video to be fully transcoded.
		if ( 'undefined' !== typeof videoFrameMs && null !== videoFrameMs && videoRef.current ) {
			captureVideoFrame( videoRef.current )
				.then( blob => {
					const formData = new FormData();
					formData.append( 'file', blob, 'poster.jpg' );

					return apiFetch( {
						path: '/wp/v2/media',
						method: 'POST',
						body: formData,
					} );
				} )
				.then( attachment => {
					onDone( {
						...videoData,
						poster: attachment.source_url,
					} );
				} )
				.catch( error => {
					debug( 'Failed to capture/upload frame poster: %o', error );
					onDone( videoData );
				} );
			return;
		}

		// No poster edits.
		onDone( videoData );
	};

	useEffect( () => {
		if ( ! guid || isFinishingUpdate ) {
			return;
		}

		if ( videoPosterImageData ) {
			debouncedSendUpdatePoster( { poster_attachment_id: videoPosterImageData?.id } );
		}
	}, [ videoPosterImageData, guid, isFinishingUpdate ] );

	const hasPosterEdits = videoPosterImageData !== null || videoFrameMs !== null;

	return [
		handleVideoFrameSelected,
		handleSelectPoster,
		handleRemovePoster,
		handleDoneUpload,
		videoPosterImageData,
		isFinishingUpdate,
		hasPosterEdits,
		videoRef,
	];
};

const UploaderProgress = ( {
	attributes,
	setAttributes,
	progress,
	file,
	paused,
	uploadedVideoData,
	onPauseOrResume,
	onDone,
	supportPauseOrResume,
	isReplacing,
	onReplaceCancel,
} ) => {
	const [
		handleVideoFrameSelected,
		handleSelectPoster,
		handleRemovePoster,
		handleDoneUpload,
		videoPosterImageData,
		isFinishingUpdate,
		hasPosterEdits,
		videoRef,
	] = usePosterAndTitleUpdate( {
		setAttributes,
		videoData: { ...uploadedVideoData, title: attributes.title },
		onDone,
	} );

	const hasUserEdits = !! attributes.title || hasPosterEdits;
	const hasAutoCompleted = useRef( false );

	/**
	 * Auto-complete the upload when the user hasn't made edits.
	 * If the user edited the title or poster, show the "Done" button instead.
	 */
	useEffect( () => {
		if ( uploadedVideoData && ! hasUserEdits && ! hasAutoCompleted.current ) {
			hasAutoCompleted.current = true;
			debug( 'Auto-completing upload (no user edits detected)...' );
			handleDoneUpload();
		}
	}, [ uploadedVideoData, hasUserEdits, handleDoneUpload ] );

	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${ roundedProgress }%` };
	const resumeText = __( 'Resume', 'jetpack-videopress-pkg' );
	const pauseText = __( 'Pause', 'jetpack-videopress-pkg' );

	// Support File from library or File instance
	const fileSizeLabel = file?.filesizeHumanReadable ?? filesize( file?.size );

	const { title } = attributes;
	const filename = removeFileNameExtension( escapeHTML( file?.name ) );

	return (
		<PlaceholderWrapper disableInstructions>
			<TextControl
				label={ __( 'Video title', 'jetpack-videopress-pkg' ) }
				className="uploading-editor__title"
				onChange={ newTitle => setAttributes( { title: newTitle } ) }
				value={ title }
				placeholder={ filename }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>

			<UploadingEditor
				file={ file }
				onSelectPoster={ handleSelectPoster }
				onRemovePoster={ handleRemovePoster }
				onVideoFrameSelected={ handleVideoFrameSelected }
				videoPosterImageData={ videoPosterImageData }
				videoRef={ videoRef }
			/>

			<div className="videopress-uploader-progress">
				{ roundedProgress < 100 ? (
					<>
						<div className="videopress-uploader-progress__file-info">
							<div className="videopress-uploader-progress__progress">
								<div className="videopress-uploader-progress__progress-loaded" style={ cssWidth } />
							</div>
							<div className="videopress-upload__percent-complete">
								{ sprintf(
									/* translators: %1$s: an upload progress percentage number, from 0-100. */
									__( 'Uploading (%1$s%%)', 'jetpack-videopress-pkg' ),
									roundedProgress
								) }
							</div>
							<div className="videopress-uploader-progress__file-size">{ fileSizeLabel }</div>
						</div>
						{ isReplacing && (
							<div className="videopress-uploader-progress__actions">
								<Button onClick={ onReplaceCancel } variant="tertiary" isDestructive>
									{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						) }
						<div className="videopress-uploader-progress__actions">
							{ roundedProgress < 100 && (
								<Button
									variant="tertiary"
									onClick={ onPauseOrResume }
									disabled={ ! supportPauseOrResume }
								>
									{ paused ? resumeText : pauseText }
								</Button>
							) }
						</div>
					</>
				) : (
					<>
						{ hasUserEdits && uploadedVideoData ? (
							<>
								<span>{ __( 'Upload Complete!', 'jetpack-videopress-pkg' ) } 🎉</span>
								<Button
									variant="primary"
									onClick={ handleDoneUpload }
									disabled={ isFinishingUpdate }
									isBusy={ isFinishingUpdate }
								>
									{ __( 'Done', 'jetpack-videopress-pkg' ) }
								</Button>
							</>
						) : (
							<span>{ __( 'Finishing up …', 'jetpack-videopress-pkg' ) } 🎬</span>
						) }
					</>
				) }
			</div>
		</PlaceholderWrapper>
	);
};

export default UploaderProgress;
export { usePosterAndTitleUpdate };
