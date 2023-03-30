/**
 *External dependencies
 */
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import {
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
	MenuItem,
	PanelBody,
	NavigableMenu,
	Dropdown,
	Button,
	ToggleControl,
	SandBox,
	Spinner,
	Notice,
} from '@wordpress/components';
import { useRef, useEffect, useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { linkOff, image as imageIcon } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import TimestampControl from '../../../../../components/timestamp-control';
import { getVideoPressUrl } from '../../../../../lib/url';
import { usePreview } from '../../../../hooks/use-preview';
import useVideoPlayer from '../../../../hooks/use-video-player';
import { VIDEO_POSTER_ALLOWED_MEDIA_TYPES } from '../../constants';
import { VideoPosterCard } from '../poster-image-block-control';
import './style.scss';
/**
 * Types
 */
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
import type { PosterPanelProps, VideoControlProps, VideoGUID } from '../../types';
import type React from 'react';

const MAX_LOOP_DURATION = 30 * 1000;
const DEFAULT_LOOP_DURATION = 10 * 1000;

/*
 * Check whether video frame poster extension is enabled.
 * `v6-video-frame-poster` is a temporary extension handled by the Jetpack plugin.
 * It will be used to hide the Video frame poster feature until it's ready.
 */
declare global {
	interface Window {
		Jetpack_Editor_Initial_State: { available_blocks: [ 'v6-video-frame-poster' ] };
	}
}

export const isVideoFramePosterEnabled = () =>
	!! window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'v6-video-frame-poster' ];

// Global scripts array to be run in the Sandbox context.
const sandboxScripts = [];

// Populate scripts array with videopressAjaxURLBlob blobal var.
if ( window.videopressAjax ) {
	const videopressAjaxURLBlob = new Blob(
		[
			`var videopressAjax = ${ JSON.stringify( {
				...window.videopressAjax,
				context: 'sandbox',
			} ) };`,
		],
		{
			type: 'text/javascript',
		}
	);

	// Token bridge script
	sandboxScripts.push(
		URL.createObjectURL( videopressAjaxURLBlob ),
		window.videopressAjax.bridgeUrl
	);
}

// Player bridge script
if ( window?.videoPressEditorState?.playerBridgeUrl ) {
	sandboxScripts.push( window.videoPressEditorState.playerBridgeUrl );
}

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export function PosterDropdown( {
	clientId,
	attributes,
	setAttributes,
}: VideoControlProps ): React.ReactElement {
	const videoPosterDescription = `video-block__poster-image-description-${ clientId }`;

	const { poster } = attributes;
	const onSelectPoster = useCallback(
		( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
			setAttributes( {
				poster: image.url,

				// Extend the posterData object to include the media library id and url.
				posterData: {
					...attributes.posterData,
					type: 'media-library',
					id: image.id,
					url: image.url,
				},
			} );
		},
		[ attributes ]
	);

	const selectPosterLabel = __( 'Select Poster Image', 'jetpack-videopress-pkg' );
	const replacePosterLabel = __( 'Replace Poster Image', 'jetpack-videopress-pkg' );

	const buttonRef = useRef< HTMLButtonElement >( null );
	const videoRatio = Number( attributes?.videoRatio ) / 100 || 9 / 16;

	const [ posterPlaceholderHeight, setPosterPlaceholderHeight ] = useState( 140 );

	useEffect( () => {
		if ( ! poster || ! buttonRef?.current ) {
			return;
		}

		const { current: buttonElement } = buttonRef;
		const buttonWidth = buttonElement?.offsetWidth;
		if ( ! buttonWidth ) {
			return;
		}

		setPosterPlaceholderHeight( buttonWidth * videoRatio );
	}, [ poster, buttonRef, videoRatio ] );

	return (
		<Dropdown
			contentClassName="poster-panel__dropdown"
			placement="top left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					ref={ buttonRef }
					style={ {
						backgroundImage: poster ? `url(${ poster })` : undefined,
						height: posterPlaceholderHeight,
						minHeight: posterPlaceholderHeight,
					} }
					className={ `poster-panel__button ${ poster ? 'has-poster' : '' }` }
					variant="secondary"
					onClick={ onToggle }
					aria-expanded={ isOpen }
				>
					<span>{ ! poster ? selectPosterLabel : replacePosterLabel }</span>
				</Button>
			) }
			renderContent={ ( { onClose } ) => {
				return (
					<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
						<MediaUploadCheck>
							<MediaUpload
								title={ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
								onSelect={ ( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
									onSelectPoster( image );
									onClose();
								} }
								allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
								render={ ( { open } ) => (
									<MenuItem
										icon={ imageIcon }
										onClick={ open }
										aria-describedby={ videoPosterDescription }
									>
										{ __( 'Open Media Library', 'jetpack-videopress-pkg' ) }
										<p id={ videoPosterDescription } hidden>
											{ poster
												? sprintf(
														/* translators: Placeholder is an image URL. */
														__( 'The current poster image url is %s', 'jetpack-videopress-pkg' ),
														poster
												  )
												: __(
														'There is no poster image currently selected',
														'jetpack-videopress-pkg'
												  ) }
										</p>
									</MenuItem>
								) }
							/>
						</MediaUploadCheck>
					</NavigableMenu>
				);
			} }
		/>
	);
}

/**
 * Return the (content) Window object of the iframe,
 * given the iframe's ref.
 *
 * @param {React.MutableRefObject< HTMLDivElement >} iFrameRef - iframe ref
 * @returns {Window | null}	                                     Window object of the iframe
 */
export const getIframeWindowFromRef = (
	iFrameRef: React.MutableRefObject< HTMLDivElement >
): Window | null => {
	const iFrame: HTMLIFrameElement = iFrameRef?.current?.querySelector(
		'iframe.components-sandbox'
	);
	return iFrame?.contentWindow;
};

type PosterFramePickerProps = {
	guid: VideoGUID;
	atTime: number;
	isGeneratingPoster?: boolean;
	onVideoFrameSelect: ( timestamp: number ) => void;
};

/**
 * React component to pick a frame from the VideoPress video
 *
 * @param {PosterFramePickerProps} props - Component properties
 * @returns { React.ReactElement}          React component
 */
function VideoFramePicker( {
	guid,
	isGeneratingPoster,
	atTime = 0.1,
	onVideoFrameSelect,
}: PosterFramePickerProps ): React.ReactElement {
	const [ timestamp, setTimestamp ] = useState( atTime );
	const [ duration, setDuration ] = useState( 0 );
	const playerWrapperRef = useRef< HTMLDivElement >( null );

	const url = getVideoPressUrl( guid, {
		autoplay: true, // Set `autoplay` and `muted` true to be able to control the video.
		muted: true,
		controls: false,
		loop: false,
	} );

	const { preview = { html: null }, isRequestingEmbedPreview } = usePreview( url );
	const { html } = preview;

	/**
	 * Handler function to deal with the communication
	 * between the iframe, which contains the video,
	 * and the parent window (block editor).
	 *
	 * @param {MessageEvent} event - Message event
	 */
	function listenEventsHandler( event: MessageEvent ) {
		const { data: eventData = {} } = event;
		const { event: eventName } = event?.data || {};

		// Pick and store the video duration in a local state.
		if ( eventName === 'videopress_durationchange' ) {
			if ( eventData?.durationMs ) {
				setDuration( eventData.durationMs );
			}
		}
	}

	const { playerIsReady } = useVideoPlayer( playerWrapperRef, isRequestingEmbedPreview, {
		atTime,
	} );

	// Listen player events.
	useEffect( () => {
		if ( isRequestingEmbedPreview ) {
			return;
		}

		if ( ! html ) {
			return;
		}

		const sandboxIFrameWindow = getIframeWindowFromRef( playerWrapperRef );
		if ( ! sandboxIFrameWindow ) {
			return;
		}

		sandboxIFrameWindow.addEventListener( 'message', listenEventsHandler );

		return () => {
			// Remove the listener when the component is unmounted.
			sandboxIFrameWindow.removeEventListener( 'message', listenEventsHandler );
		};
	}, [ playerWrapperRef, isRequestingEmbedPreview, html ] );

	return (
		<div className="poster-panel__frame-picker">
			<div
				ref={ playerWrapperRef }
				className={ classnames( 'poster-panel__frame-picker__sandbox-wrapper', {
					'is-player-ready': playerIsReady,
					'is-generating-poster': isGeneratingPoster,
				} ) }
			>
				{ ( ! playerIsReady || isGeneratingPoster ) && <Spinner /> }
				<SandBox html={ html } scripts={ sandboxScripts } />
			</div>

			{ isGeneratingPoster && (
				<Notice status="info" className="poster-panel__notice" isDismissible={ false }>
					{ __(
						'Generating video poster image. It may take a few seconds.',
						'jetpack-videopress-pkg'
					) }
				</Notice>
			) }

			<TimestampControl
				label={ __( 'Video frame', 'jetpack-videopress-pkg' ) }
				help={ __( 'Select the frame you want to use as poster image', 'jetpack-videopress-pkg' ) }
				disabled={ isRequestingEmbedPreview || isGeneratingPoster }
				max={ duration }
				value={ timestamp }
				wait={ 250 }
				onChange={ setTimestamp }
				onDebounceChange={ iframeTimePosition => {
					const sandboxIFrameWindow = getIframeWindowFromRef( playerWrapperRef );
					sandboxIFrameWindow?.postMessage( {
						event: 'videopress_action_set_currenttime',
						currentTime: iframeTimePosition / 1000,
					} );
					onVideoFrameSelect( iframeTimePosition );
				} }
			/>
		</div>
	);
}

type VideoHoverPreviewControlProps = {
	previewOnHover?: boolean;
	previewAtTime?: number;
	loopDuration?: number;
	videoDuration: number;
	onPreviewOnHoverChange: ( previewOnHover: boolean ) => void;
	onAtTimeChange: ( timestamp: number ) => void;
	onLoopDurationChange: ( duration: number ) => void;
};

/**
 * React component to select the video preview options when the user hovers the video
 *
 * @param {VideoHoverPreviewControlProps} props - Component properties
 * @returns { React.ReactElement}                 React component
 */
function VideoHoverPreviewControl( {
	previewOnHover = false,
	previewAtTime = 0,
	loopDuration = DEFAULT_LOOP_DURATION,
	videoDuration,
	onPreviewOnHoverChange,
	onAtTimeChange,
	onLoopDurationChange,
}: VideoHoverPreviewControlProps ): React.ReactElement {
	const [ maxStartingPoint, setMaxStartingPoint ] = useState( videoDuration - loopDuration );

	useEffect( () => {
		setMaxStartingPoint( videoDuration - loopDuration );
	}, [ videoDuration, loopDuration ] );

	return (
		<>
			<ToggleControl
				className="poster-panel__preview-toggle"
				label={ __( 'Video preview on hover', 'jetpack-videopress-pkg' ) }
				checked={ previewOnHover }
				onChange={ onPreviewOnHoverChange }
			/>

			{ previewOnHover && (
				<>
					<TimestampControl
						label={ __( 'Starting point', 'jetpack-videopress-pkg' ) }
						max={ maxStartingPoint }
						decimalPlaces={ 2 }
						value={ previewAtTime }
						onChange={ onAtTimeChange }
					/>

					<NumberControl
						className="poster-panel__loop-duration"
						min={ 0 }
						max={ Math.min( MAX_LOOP_DURATION, videoDuration ) / 1000 }
						step={ 1 }
						label={ __( 'Loop duration', 'jetpack-videopress-pkg' ) }
						spinControls="none"
						placeholder="00"
						suffix={ __( 'sec', 'jetpack-videopress-pkg' ) }
						value={ loopDuration / 1000 }
						onChange={ duration => {
							onLoopDurationChange( Math.max( Math.min( MAX_LOOP_DURATION, duration * 1000 ), 0 ) );
						} }
					/>
				</>
			) }
		</>
	);
}

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function PosterPanel( {
	attributes,
	setAttributes,
	isGeneratingPoster,
}: PosterPanelProps ): React.ReactElement {
	const { poster, posterData } = attributes;

	const [ pickFromFrame, setPickFromFrame ] = useState(
		attributes?.posterData?.type === 'video-frame'
	);
	const [ previewOnHover, setPreviewOnHover ] = useState(
		attributes?.posterData?.previewOnHover || false
	);
	const [ previewAtTime, setPreviewAtTime ] = useState(
		attributes?.posterData?.previewAtTime || posterData?.atTime || 0
	);
	const [ previewLoopDuration, setPreviewLoopDuration ] = useState(
		attributes?.posterData?.previewLoopDuration || DEFAULT_LOOP_DURATION
	);

	const videoDuration = attributes?.duration;

	const onRemovePoster = () => {
		setAttributes( { poster: '', posterData: { ...attributes.posterData, url: '' } } );
	};

	const switchPosterSource = useCallback(
		( shouldPickFromFrame: boolean ) => {
			setPickFromFrame( shouldPickFromFrame );
			setAttributes( {
				// Extend the posterData attr with the new type.
				posterData: {
					...attributes.posterData,
					type: shouldPickFromFrame ? 'video-frame' : 'media-library',
				},

				// Clean the poster URL when it should be picked from the video frame.
				poster: shouldPickFromFrame ? '' : attributes.posterData.url || '',
			} );
		},
		[ attributes ]
	);

	const onPreviewOnHoverChange = useCallback(
		( shouldPreviewOnHover: boolean ) => {
			setPreviewOnHover( shouldPreviewOnHover );

			setAttributes( {
				posterData: {
					...attributes.posterData,
					previewOnHover: shouldPreviewOnHover,
				},
			} );
		},
		[ attributes ]
	);

	const onAtTimeChange = useCallback(
		( atTime: number ) => {
			setPreviewAtTime( atTime );
			setAttributes( {
				posterData: {
					...attributes.posterData,
					previewAtTime: atTime,
				},
			} );
		},
		[ attributes ]
	);

	const onLoopDurationChange = useCallback(
		( loopDuration: number ) => {
			setPreviewLoopDuration( loopDuration );
			let previewStart = previewAtTime;

			// Adjust the starting point if the loop duration is too long
			if ( previewAtTime + loopDuration > videoDuration ) {
				previewStart = videoDuration - loopDuration;
				setPreviewAtTime( previewStart );
			}

			setAttributes( {
				posterData: {
					...attributes.posterData,
					previewLoopDuration: loopDuration,
					previewAtTime: previewStart,
				},
			} );
		},
		[ attributes ]
	);

	if ( ! isVideoFramePosterEnabled() ) {
		return (
			<PanelBody title={ __( 'Poster', 'jetpack-videopress-pkg' ) } className="poster-panel">
				<PosterDropdown attributes={ attributes } setAttributes={ setAttributes } />
				<VideoPosterCard poster={ poster } className="poster-panel-card" />

				{ poster && (
					<MenuItem onClick={ onRemovePoster } icon={ linkOff } isDestructive variant="tertiary">
						{ __( 'Remove and use default', 'jetpack-videopress-pkg' ) }
					</MenuItem>
				) }
			</PanelBody>
		);
	}

	const panelTitle = isVideoFramePosterEnabled()
		? __( 'Poster and preview', 'jetpack-videopress-pkg' )
		: __( 'Poster', 'jetpack-videopress-pkg' );

	return (
		<PanelBody title={ panelTitle } className="poster-panel" initialOpen={ false }>
			<ToggleControl
				label={ __( 'Pick from video frame', 'jetpack-videopress-pkg' ) }
				checked={ pickFromFrame }
				onChange={ switchPosterSource }
			/>

			<div
				className={ classnames( 'poster-panel__frame-wrapper', { 'is-selected': pickFromFrame } ) }
			>
				<VideoFramePicker
					isGeneratingPoster={ isGeneratingPoster }
					guid={ attributes?.guid }
					atTime={ posterData?.atTime }
					onVideoFrameSelect={ timestamp => {
						setAttributes( {
							posterData: {
								...attributes.posterData,
								type: 'video-frame',
								atTime: timestamp,
							},
							poster: '',
						} );
					} }
				/>
			</div>

			<div
				className={ classnames( 'poster-panel__image-wrapper', {
					'is-selected': ! pickFromFrame,
				} ) }
			>
				<PosterDropdown attributes={ attributes } setAttributes={ setAttributes } />

				<VideoPosterCard poster={ poster } className="poster-panel-card" />

				{ poster && (
					<MenuItem onClick={ onRemovePoster } icon={ linkOff } isDestructive variant="tertiary">
						{ __( 'Remove and use default', 'jetpack-videopress-pkg' ) }
					</MenuItem>
				) }
			</div>

			<VideoHoverPreviewControl
				previewOnHover={ previewOnHover }
				previewAtTime={ previewAtTime }
				loopDuration={ previewLoopDuration }
				videoDuration={ videoDuration }
				onPreviewOnHoverChange={ onPreviewOnHoverChange }
				onAtTimeChange={ onAtTimeChange }
				onLoopDurationChange={ onLoopDurationChange }
			/>
		</PanelBody>
	);
}
