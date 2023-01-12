/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner, TextControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';
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

const usePosterAndTitleUpdate = ( { setAttributes, attributes, onDone } ) => {
	const [ isFinishingUpdate, setIsFinishingUpdate ] = useState( false );
	const [ videoFrameMs, setVideoFrameMs ] = useState( null );
	const [ videoPosterImageData, setVideoPosterImageData ] = useState( null );
	const { title } = attributes;

	const guid = attributes?.guid;
	const videoPressUploadPoster = usePosterUpload( guid );
	const videoPressGetPoster = usePosterImage( guid );
	const updateMeta = useMetaUpdate( attributes?.id );

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

		if ( videoPosterImageData ) {
			updates.push( sendUpdatePoster( { poster_attachment_id: videoPosterImageData?.id } ) );
		} else if (
			// Check if videoFrameMs is not undefined or null instead of bool check to allow 0ms. selection
			'undefined' !== typeof videoFrameMs &&
			null !== videoFrameMs
		) {
			updates.push( sendUpdatePoster( { at_time: videoFrameMs, is_millisec: true } ) );
		}

		Promise.allSettled( updates ).then( () => {
			setIsFinishingUpdate( false );
			setAttributes( attributes );
			onDone();
		} );
	};

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
		attributes: { ...uploadedVideoData, title: attributes.title },
		onDone,
	} );

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
				{ uploadedVideoData ? (
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
					<>
						{ roundedProgress < 100 ? (
							<>
								<div className="videopress-uploader-progress__file-info">
									<div className="videopress-uploader-progress__progress">
										<div
											className="videopress-uploader-progress__progress-loaded"
											style={ cssWidth }
										/>
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
										<Button variant="link" onClick={ onReplaceCancel } isDestructive>
											{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
										</Button>
									</div>
								) }
								<div className="videopress-uploader-progress__actions">
									{ roundedProgress < 100 && (
										<Button
											variant="link"
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
								<span>{ __( 'Finishing up …', 'jetpack-videopress-pkg' ) } 🎬</span>
								<Spinner />
							</>
						) }
					</>
				) }
			</div>
		</PlaceholderWrapper>
	);
};

export default UploaderProgress;
