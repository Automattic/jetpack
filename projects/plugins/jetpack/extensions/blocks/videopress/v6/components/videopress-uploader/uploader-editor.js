/**
 * WordPress dependencies
 */
import { MediaUpload } from '@wordpress/block-editor';
import { TextControl, BaseControl, RangeControl } from '@wordpress/components';
import { createInterpolateElement, useEffect, useRef, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { PlayIcon } from '../icons';

import './style.scss';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

const removeFileNameExtension = name => {
	return name.replace( /\.[^/.]+$/, '' );
};

const SelectFrame = ( { file } ) => {
	const [ maxDuration, setMaxDuration ] = useState( 100 );
	const videoPlayer = useRef( null );
	const posterImageLink = useRef( null );

	useEffect( () => {
		videoPlayer.current.src = URL.createObjectURL( file );
	}, [ file ] );

	const onSelectPoster = () => {};

	const onDurationChange = event => {
		const newDuration = event.target.duration;
		setMaxDuration( newDuration );

		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newDuration / 2;
		}
	};

	const onRangeChange = newRangeValue => {
		// onVideoFrameSelected( newRangeValue * 1000 );

		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newRangeValue;
		}
	};

	return (
		<>
			<div className="uploading-editor__video-container">
				<video
					ref={ videoPlayer }
					muted
					className="uploading-editor__video"
					onDurationChange={ onDurationChange }
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
	);
};

const UploadingEditor = props => {
	const {
		file,
		// onSelectPoster,
		// onRemovePoster,
		// videoPosterImageData,
		// onChangeTitle,
		// onVideoFrameSelected,
	} = props;
	const filename = removeFileNameExtension( escapeHTML( file?.name ) );
	const [ title, setTitle ] = useState( filename );

	return (
		<div className="uploading-editor">
			<TextControl
				label={ __( 'Video title', 'jetpack' ) }
				className="uploading-editor__title"
				onChange={ newTitle => setTitle( newTitle ) }
				value={ title }
			/>
			<BaseControl label={ __( 'Video poster (optional)', 'jetpack' ) }>
				<SelectFrame file={ file } />
			</BaseControl>
		</div>
	);
};

export default UploadingEditor;
