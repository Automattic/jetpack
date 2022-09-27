/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { Button, TextControl, BaseControl } from '@wordpress/components';
import { createInterpolateElement, useRef, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';
import playIcon from '../../../../../components/icons/play-icon';
import VideoFrameSelector from '../../../../../components/video-frame-selector';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const removeFileNameExtension = name => {
	return name.replace( /\.[^/.]+$/, '' );
};

const PosterImage = ( { videoPosterImageUrl } ) => {
	return (
		<div className="uploading-editor__poster-image">
			{ videoPosterImageUrl ? (
				<img src={ videoPosterImageUrl } alt="Poster" />
			) : (
				<span>No Poster Selected</span>
			) }
		</div>
	);
};

const Poster = ( { file, videoPosterImageData, onVideoFrameSelected } ) => {
	const hasPosterImage = Boolean( videoPosterImageData?.url );

	// - Avoid recreate the object on every render
	// - Support attachment from Media Library or File instance
	const src = useRef( file?.url ?? URL.createObjectURL( file ) );

	return (
		<div className={ classNames( 'uploading-editor__poster-container' ) }>
			<VideoFrameSelector
				src={ src?.current }
				onVideoFrameSelected={ onVideoFrameSelected }
				className={ classNames( { 'uploading-editor__hide': hasPosterImage } ) }
			/>
			{ hasPosterImage && (
				<>
					<PosterImage videoPosterImageUrl={ videoPosterImageData?.url } />
					<Icon className="uploading-editor__play-icon" icon={ playIcon } />
				</>
			) }
		</div>
	);
};

const PosterActions = ( { hasPoster, onSelectPoster, onRemovePoster } ) => {
	if ( hasPoster ) {
		return (
			<MediaUpload
				title={ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
				onSelect={ onSelectPoster }
				allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
				render={ ( { open } ) => (
					<div className="uploading-editor__poster-buttons">
						<Button onClick={ onRemovePoster } variant="secondary" isDestructive>
							{ __( 'Remove Poster Image', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button variant="secondary" onClick={ open }>
							{ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				) }
			/>
		);
	}

	return (
		<span className="uploading-editor__scrubber-help">
			{ createInterpolateElement(
				__(
					'This is how the video will look. Use the slider to choose a poster or <a>select a custom one</a>.',
					'jetpack-videopress-pkg'
				),
				{
					a: (
						<MediaUpload
							title={ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
							onSelect={ onSelectPoster }
							allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
							render={ ( { open } ) => (
								<a
									className="uploading-editor__upload-link"
									onClick={ open }
									onKeyDown={ open }
									role="button"
									tabIndex={ 0 }
								>
									{ __( 'select a custom one', 'jetpack-videopress-pkg' ) }
								</a>
							) }
						/>
					),
				}
			) }
		</span>
	);
};

const UploadingEditor = props => {
	const {
		file,
		onSelectPoster,
		onRemovePoster,
		videoPosterImageData,
		onChangeTitle,
		onVideoFrameSelected,
	} = props;
	const filename = removeFileNameExtension( escapeHTML( file?.name ) );
	const [ title, setTitle ] = useState( filename );
	const handleTitleChange = newTitle => {
		onChangeTitle( newTitle );
		setTitle( newTitle );
	};

	return (
		<div className="uploading-editor">
			<TextControl
				label={ __( 'Video title', 'jetpack-videopress-pkg' ) }
				className="uploading-editor__title"
				onChange={ handleTitleChange }
				value={ title }
			/>
			<BaseControl label={ __( 'Video poster (optional)', 'jetpack-videopress-pkg' ) }>
				<Poster
					file={ file }
					videoPosterImageData={ videoPosterImageData }
					onVideoFrameSelected={ onVideoFrameSelected }
				/>
				<PosterActions
					hasPoster={ Boolean( videoPosterImageData ) }
					onSelectPoster={ onSelectPoster }
					onRemovePoster={ onRemovePoster }
				/>
			</BaseControl>
		</div>
	);
};

export default UploadingEditor;
