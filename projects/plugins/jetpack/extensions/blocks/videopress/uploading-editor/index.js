/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { BaseControl, Button, TextControl, RangeControl } from '@wordpress/components';
import { createInterpolateElement, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { PlayIcon } from '../../../shared/icons';

import './style.scss';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const PosterImageWrapper = props => {
	const { videoPosterImageUrl } = props;
	return (
		<div className="resumable-upload__editor-thumb-placeholder">
			{ videoPosterImageUrl ? (
				<>
					<img src={ videoPosterImageUrl } alt="Poster" />
					<Icon className="uploading-editor__play-icon" icon={ PlayIcon } />
				</>
			) : (
				<span>No Poster Selected</span>
			) }
		</div>
	);
};

export const PosterSelector = props => {
	const { onSelectPoster, onRemovePoster } = props;

	return (
		<BaseControl className={ clsx( props.className, 'editor-video-poster-control' ) }>
			<PosterImageWrapper { ...props } />
			<MediaUpload
				title={ __( 'Select Poster Image', 'jetpack' ) }
				onSelect={ onSelectPoster }
				allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
				render={ ( { open } ) => (
					<div className="poster-selector__buttons">
						<Button onClick={ onRemovePoster } variant="link" isDestructive>
							{ __( 'Remove Poster Image', 'jetpack' ) }
						</Button>
						<Button variant="secondary" onClick={ open }>
							{ __( 'Select Poster Image', 'jetpack' ) }
						</Button>
					</div>
				) }
			/>
		</BaseControl>
	);
};

export const UploadingEditor = props => {
	const {
		file,
		onSelectPoster,
		onRemovePoster,
		videoPosterImageData,
		title,
		onChangeTitle,
		onVideoFrameSelected,
	} = props;
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const [ canDisplayThumbnailScrubber, setCanDisplayThumbnailScrubber ] = useState( true );
	const videoPlayer = useRef( null );
	const posterImageLink = useRef( null );

	const onVideoError = () => {
		setCanDisplayThumbnailScrubber( false );
	};

	const onVideoLoad = event => {
		if ( ! event.target.videoHeight ) {
			onVideoError();
		}
	};

	useEffect( () => {
		if ( null === file ) {
			return;
		}

		if ( videoPlayer ) {
			videoPlayer.current.src = URL.createObjectURL( file );
		}
	}, [ file, videoPlayer ] );

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

	// If we have a poster image, hide the video but keep it in the dom
	const posterSelectedStyle = {};
	if ( videoPosterImageData ) {
		posterSelectedStyle.display = 'none';
	}

	return (
		<>
			<div className="uploading-editor">
				<div className="uploading-editor__summary"></div>
				<div className="uploading-editor__fields">
					<TextControl
						label={ __( 'Video title', 'jetpack' ) }
						className="uploading-editor__title"
						onChange={ onChangeTitle }
						value={ title }
					/>
					<div className="uploading-editor__content">
						<BaseControl label={ __( 'Video poster (optional)', 'jetpack' ) }>
							{ canDisplayThumbnailScrubber ? (
								<>
									<div className="uploading-editor__video-container">
										<div className="uploading-editor__video-poster-wrapper">
											{ videoPosterImageData && (
												<PosterSelector
													onSelectPoster={ onSelectPoster }
													onRemovePoster={ onRemovePoster }
													videoPosterImageUrl={ videoPosterImageData.url }
												/>
											) }
											<video
												ref={ videoPlayer }
												muted
												className="uploading-editor__video"
												onDurationChange={ onDurationChange }
												onError={ onVideoError }
												onLoadedMetadata={ onVideoLoad }
												style={ posterSelectedStyle }
											/>
										</div>
										{ ! videoPosterImageData && (
											<Icon className="uploading-editor__play-icon" icon={ PlayIcon } />
										) }
									</div>
									<span style={ posterSelectedStyle }>
										<RangeControl
											className="uploading-editor__range"
											min="0"
											step="0.1"
											max={ maxDuration }
											showTooltip={ false }
											withInputField={ false }
											onChange={ onRangeChange }
										/>
									</span>
									<span className="uploading-editor__scrubber-help" style={ posterSelectedStyle }>
										{ createInterpolateElement(
											__(
												'This is how the video will look. Use the slider to choose a poster or <a>select a custom one</a>.',
												'jetpack'
											),
											{
												a: (
													<MediaUpload
														title={ __( 'Select Poster Image', 'jetpack' ) }
														onSelect={ onSelectPoster }
														allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
														render={ ( { open } ) => (
															<a
																className="uploading-editor__upload-link"
																onClick={ open }
																onKeyDown={ open }
																ref={ posterImageLink }
																role="button"
																tabIndex={ 0 }
															>
																{ __( 'select a custom one', 'jetpack' ) }
															</a>
														) }
													/>
												),
											}
										) }
									</span>
								</>
							) : (
								<PosterSelector
									onSelectPoster={ onSelectPoster }
									videoPosterImageUrl={ videoPosterImageData ? videoPosterImageData.url : null }
								/>
							) }
						</BaseControl>
					</div>
				</div>
			</div>
		</>
	);
};
