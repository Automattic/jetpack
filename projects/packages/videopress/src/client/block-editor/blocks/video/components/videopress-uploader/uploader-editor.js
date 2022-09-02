/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { Button, TextControl, BaseControl, RangeControl } from '@wordpress/components';
import { createInterpolateElement, useEffect, useRef, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';
import { PlayIcon } from '../icons';

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
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const videoPlayer = useRef( null );
	const hasPosterImage = Boolean( videoPosterImageData?.url );

	useEffect( () => {
		// Support File from library or File instance
		const src = file?.url ?? URL.createObjectURL( file );
		videoPlayer.current.src = src;
	}, [ file ] );

	const onDurationChange = event => {
		const newDuration = event.target.duration;
		setMaxDuration( newDuration );

		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newDuration / 2;
		}
	};

	const onRangeChange = newRangeValue => {
		onVideoFrameSelected( newRangeValue * 1000 );
		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newRangeValue;
		}
	};

	return (
		<div
			className={ classNames( 'uploading-editor__video-container', {
				[ 'uploading-editor__video-container--enabled' ]: ! hasPosterImage,
			} ) }
		>
			<video
				ref={ videoPlayer }
				muted
				className={ classNames( 'uploading-editor__video', {
					[ 'uploading-editor__video--hide' ]: hasPosterImage,
				} ) }
				onDurationChange={ onDurationChange }
			/>
			{ hasPosterImage && <PosterImage videoPosterImageUrl={ videoPosterImageData?.url } /> }
			<Icon className="uploading-editor__play-icon" icon={ PlayIcon } />
			{ ! hasPosterImage && (
				<RangeControl
					className="uploading-editor__range"
					min="0"
					step="0.1"
					max={ maxDuration }
					showTooltip={ false }
					withInputField={ false }
					onChange={ onRangeChange }
				/>
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
