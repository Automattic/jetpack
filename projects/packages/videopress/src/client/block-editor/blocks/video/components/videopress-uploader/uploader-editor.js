/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { Button, BaseControl } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import playIcon from '../../../../../components/icons/play-icon';
import VideoFrameSelector from '../../../../../components/video-frame-selector';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

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
		<div className={ clsx( 'uploading-editor__poster-container' ) }>
			<VideoFrameSelector
				src={ src?.current }
				onVideoFrameSelected={ onVideoFrameSelected }
				className={ clsx( { 'uploading-editor__hide': hasPosterImage } ) }
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
			{ __(
				'This is how the video will look. Use the slider to choose a poster image or change it from the block settings.',
				'jetpack-videopress-pkg'
			) }
		</span>
	);
};

const UploadingEditor = props => {
	const { file, onSelectPoster, onRemovePoster, videoPosterImageData, onVideoFrameSelected } =
		props;

	return (
		<div className="uploading-editor">
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
