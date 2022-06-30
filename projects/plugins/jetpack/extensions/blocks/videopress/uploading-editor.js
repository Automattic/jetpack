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
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import { PlayIcon } from '../../shared/icons';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

export const PosterSelector = props => {
	const { onSelectPoster, videoPosterImageUrl } = props;
	const posterImageButton = useRef( null );

	return (
		<BaseControl className={ classNames( props.className, 'editor-video-poster-control' ) }>
			<div className="resumable-upload__editor-thumb-placeholder">
				{ videoPosterImageUrl ? (
					<img src={ videoPosterImageUrl } alt="Poster" />
				) : (
					<span>No Poster Selected</span>
				) }
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
	const {
		file,
		onSelectPoster,
		videoPosterImageData,
		title,
		onChangeTitle,
		onVideoFrameSelected,
		onPosterSelectionTabChange,
	} = props;
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const [ selectedTab, setSelectedTab ] = useState( 'tab-frame' );
	const [ canDisplayThumbnailScrubber, setCanDisplayThumbnailScrubber ] = useState( true );
	const videoPlayer = useRef( null );

	const onVideoError = () => {
		setCanDisplayThumbnailScrubber( false );
		onSelectedTab( 'tab-upload' );
	};

	const onVideoLoad = event => {
		if ( ! event.target.videoHeight ) {
			onVideoError();
		} else {
			onPosterSelectionTabChange( selectedTab );
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
		videoPlayer.current.currentTime = newDuration / 2;
	};

	const onRangeChange = newRangeValue => {
		onVideoFrameSelected( newRangeValue * 1000 );
		videoPlayer.current.currentTime = newRangeValue;
	};

	const frameClasses = classNames( 'uploading-editor__frame-selector', {
		'active-tab': 'tab-frame' === selectedTab,
	} );

	const onSelectedTab = tabName => {
		setSelectedTab( tabName );
		onPosterSelectionTabChange( tabName );
	};

	const tabsToDisplay = [
		{
			name: 'tab-upload',
			title: __( 'Upload', 'jetpack' ),
		},
	];

	if ( canDisplayThumbnailScrubber ) {
		tabsToDisplay.unshift( {
			name: 'tab-frame',
			title: __( 'Select frame', 'jetpack' ),
		} );
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
					<div className="uploading-editor__tab-content">
						{ canDisplayThumbnailScrubber ? (
							<div className={ frameClasses }>
								<BaseControl label={ __( 'Video poster (optional)', 'jetpack' ) }>
									<div className="uploading-editor__video-container">
										<video
											ref={ videoPlayer }
											muted
											class="uploading-editor__video"
											onDurationChange={ onDurationChange }
											onError={ onVideoError }
											onLoadedMetadata={ onVideoLoad }
										/>
										<Icon className="uploading-editor__play-icon" icon={ PlayIcon } />
									</div>
									<RangeControl
										className="uploading-editor__range"
										min="0"
										step="0.1"
										max={ maxDuration }
										showTooltip={ false }
										withInputField={ false }
										onChange={ onRangeChange }
									/>
									<span className="uploading-editor__scrubber-help">
										{ createInterpolateElement(
											__(
												'This is how the video will look. Use the slider to choose a poster or <a>upload an image</a>.',
												'jetpack'
											),
											{
												a: <a href="javascript:void(0)" onClick={ () => {} } />,
											}
										) }
									</span>
								</BaseControl>
							</div>
						) : (
							<PosterSelector
								className={
									'tab-upload' === selectedTab || ! canDisplayThumbnailScrubber ? 'active-tab' : ''
								}
								onSelectPoster={ onSelectPoster }
								videoPosterImageUrl={ videoPosterImageData ? videoPosterImageData.url : null }
							/>
						) }
					</div>
				</div>
			</div>
		</>
	);
};
