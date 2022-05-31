/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, TextControl, BaseControl, RangeControl, TabPanel } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { chevronRightSmall } from '@wordpress/icons';

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
		onEditorShown,
		videoPosterImageData,
		title,
		onChangeTitle,
		onVideoFrameSelected,
		onPosterSelectionTabChange,
	} = props;
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const [ showEditor, setShowEditor ] = useState( false );
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

	const summaryButtonClasses = classNames( 'uploading-editor__summary-button', {
		active: showEditor,
	} );

	const fieldsClasses = classNames( 'uploading-editor__fields', {
		show: showEditor,
	} );

	const frameClasses = classNames( 'uploading-editor__frame-selector', {
		'active-tab': 'tab-frame' === selectedTab,
	} );

	const onSelectedTab = tabName => {
		setSelectedTab( tabName );
		onPosterSelectionTabChange( tabName );
	};

	const handleShowEditor = () => {
		onEditorShown();
		setShowEditor( ! showEditor );
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
				<div className="uploading-editor__summary">
					<div
						className={ summaryButtonClasses }
						role="button"
						tabIndex="0"
						onKeyDown={ handleShowEditor }
						onClick={ handleShowEditor }
					>
						{ chevronRightSmall }
						{ __(
							'Your video is uploading. You can edit your title and poster image while you wait.',
							'jetpack'
						) }
					</div>
				</div>
				<div className={ fieldsClasses }>
					<TextControl
						className="uploading-editor__title"
						onChange={ onChangeTitle }
						value={ title }
					/>
					<TabPanel
						className="uploading-editor__tabs"
						tabs={ tabsToDisplay }
						onSelect={ onSelectedTab }
					>
						{ () => {
							// Necessary evil to avoid TabPanel error
						} }
					</TabPanel>
					<div className="uploading-editor__tab-content">
						{ canDisplayThumbnailScrubber && (
							<div className={ frameClasses }>
								<video
									ref={ videoPlayer }
									muted
									class="uploading-editor__video"
									onDurationChange={ onDurationChange }
									onError={ onVideoError }
									onLoadedMetadata={ onVideoLoad }
								/>
								<RangeControl
									className="uploading-editor__range"
									min="0"
									step="0.1"
									max={ maxDuration }
									showTooltip={ false }
									withInputField={ false }
									onChange={ onRangeChange }
									help={ __( 'Select a poster frame', 'jetpack' ) }
								/>
							</div>
						) }
						<PosterSelector
							className={
								'tab-upload' === selectedTab || ! canDisplayThumbnailScrubber ? 'active-tab' : ''
							}
							onSelectPoster={ onSelectPoster }
							videoPosterImageUrl={ videoPosterImageData ? videoPosterImageData.url : null }
						/>
					</div>
				</div>
			</div>
		</>
	);
};
