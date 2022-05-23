/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, TextControl, BaseControl } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { useRef, useState } from '@wordpress/element';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

export const PosterSelector = props => {
	const { onSelectPoster, videoPosterImageUrl } = props;
	const posterImageButton = useRef( null );

	return (
		<BaseControl className="editor-video-poster-control" label={ __( 'Poster Image', 'jetpack' ) }>
			<div className="resumable-upload__editor-thumb-placeholder">
			{
				videoPosterImageUrl ? <img src={ videoPosterImageUrl } alt="Poster" /> : <span>No Poster Selected</span>
			}
			</div>
			<MediaUpload
				title={ __( 'Select Poster Image', 'jetpack' ) }
				onSelect={ onSelectPoster }
				allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
				render={ ( { open } ) => (
					<Button variant="secondary" onClick={ open } ref={ posterImageButton }>
						{ __( 'Select Poster Image', 'jetpack' ) }
					</Button>
				) }
			/>
		</BaseControl>
	);
};

export const UploadingEditor = props => {
	const [ videoTitle, setVideoTitle ] = useState( props.filename );
	const [ videoDescription, setVideoDescription ] = useState( '' );
	const [ videoPosterImageData, setVideoPosterImageData ] = useState( null );

	const onChangeVideoTitle = newTitle => {
		setVideoTitle( newTitle );
	};

	const onChangeVideoDescription = newDescription => {
		setVideoDescription( newDescription );
	};

	const onSelectPoster = posterImage => {
		console.log( 'onSelectPoster', posterImage );
		setVideoPosterImageData( posterImage );
		// if ( currentUploadKey ) {
		// 	window.localStorage[ 'poster-image-' + currentUploadKey ] = posterImage.url;
		// }
	};

	return (
		<>
			<div className="resumable-upload__editor">
				<TextControl label="Title" onChange={ onChangeVideoTitle } value={ videoTitle } />
				<PosterSelector onSelectPoster={ onSelectPoster } videoPosterImageUrl={ videoPosterImageData ? videoPosterImageData.url : null } />
			</div>
		</>
	);
};
