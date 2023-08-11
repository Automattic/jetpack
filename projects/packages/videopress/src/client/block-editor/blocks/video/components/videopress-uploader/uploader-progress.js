/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, TextControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';
import debugFactory from 'debug';
import filesize from 'filesize';
/**
 * Internal dependencies
 */
import useMetaUpdate from '../../../../../hooks/use-meta-update.js';
import usePosterImage from '../../../../../hooks/use-poster-image.js';
import usePosterUpload from '../../../../../hooks/use-poster-upload.js';
import { removeFileNameExtension } from '../../../../../lib/url';
import { PlaceholderWrapper } from '../../edit';
import UploadingEditor from './uploader-editor.js';

const debug = debugFactory( 'videopress:block:uploader' );

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

	const updatePoster = ( { data: result } ) => {
		if ( result?.generating ) {
			setTimeout( () => {
				getPosterImage().then( response => updatePoster( response ) );
			}, 2000 );
		} else if ( result?.poster ) {
			setAttributes( { poster: result?.poster } );
		}
	};

	const sendUpdatePoster = data => {
		return new Promise( ( resolve, reject ) => {
			videoPressUploadPoster( data )
				.then( result => {
					updatePoster( result );
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

	const debouncedSsendUpdatePoster = useDebounce( posterData => {
		sendUpdatePoster( posterData );
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
	};

	const handleDoneUpload = () => {
		setIsFinishingUpdate( true );

		const updates = [];

		if ( title ) {
			updates.push( sendUpdateTitleRequest() );
		}

		Promise.allSettled( updates ).then( () => {
			setIsFinishingUpdate( false );
			onDone( videoData );
		} );
	};

	useEffect( () => {
		if ( ! guid ) {
			return;
		}

		if ( videoPosterImageData ) {
			return debouncedSsendUpdatePoster( { poster_attachment_id: videoPosterImageData?.id } );
		}

		// Check if videoFrameMs is not undefined or null instead of bool check to allow 0ms. selection
		if ( 'undefined' !== typeof videoFrameMs && null !== videoFrameMs ) {
			debouncedSsendUpdatePoster( { at_time: videoFrameMs, is_millisec: true } );
		}
	}, [ videoPosterImageData, videoFrameMs, guid ] );

	return [
		handleVideoFrameSelected,
		handleSelectPoster,
		handleRemovePoster,
		handleDoneUpload,
		videoPosterImageData,
		isFinishingUpdate,
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
	] = usePosterAndTitleUpdate( {
		setAttributes,
		videoData: { ...uploadedVideoData, title: attributes.title },
		onDone,
	} );

	/**
	 * Flag to control the processing state
	 */
	const [ isProcessing, setIsProcessing ] = useState( true );

	/**
	 * When the upload and the metadata update is ready,
	 * wait for some time and then release the "Done" button.
	 */
	useEffect( () => {
		if ( uploadedVideoData && ! isFinishingUpdate && isProcessing ) {
			debug( 'Waiting for some time before enabling the DONE button...' );
			setTimeout( () => {
				debug( 'Done, enabling the DONE button now...' );
				setIsProcessing( false );
			}, 2500 );
		}
	}, [ uploadedVideoData, isFinishingUpdate ] );

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
			/>

			<UploadingEditor
				file={ file }
				onSelectPoster={ handleSelectPoster }
				onRemovePoster={ handleRemovePoster }
				onVideoFrameSelected={ handleVideoFrameSelected }
				videoPosterImageData={ videoPosterImageData }
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
									/* translators: Placeholder is an upload progress percenatage number, from 0-100. */
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
						{ ! isProcessing ? (
							<span>{ __( 'Upload Complete!', 'jetpack-videopress-pkg' ) } 🎉</span>
						) : (
							<span>{ __( 'Finishing up …', 'jetpack-videopress-pkg' ) } 🎬</span>
						) }
						<Button
							variant="primary"
							onClick={ handleDoneUpload }
							disabled={ isProcessing }
							isBusy={ isProcessing }
						>
							{ __( 'Done', 'jetpack-videopress-pkg' ) }
						</Button>
					</>
				) }
			</div>
		</PlaceholderWrapper>
	);
};

export default UploaderProgress;
