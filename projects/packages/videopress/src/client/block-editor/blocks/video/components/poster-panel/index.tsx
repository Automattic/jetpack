/**
 *External dependencies
 */
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import {
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
import {
	useRef,
	useEffect,
	useState,
	useCallback,
	createInterpolateElement,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { linkOff, image as imageIcon } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import TimestampControl from '../../../../../components/timestamp-control';
import { getVideoPressUrl } from '../../../../../lib/url';
import { millisecondsToClockTime } from '../../../../../utils/video-chapters/generate-chapters-file';
import { usePreview } from '../../../../hooks/use-preview';
import useVideoPlayer from '../../../../hooks/use-video-player';
import { VIDEO_POSTER_ALLOWED_MEDIA_TYPES } from '../../constants';
import { VideoPosterCard } from '../poster-image-block-control';
import './style.scss';
/**
 * Types
 */
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
import type { PosterDataProps, PosterPanelProps, VideoControlProps, VideoGUID } from '../../types';
import type React from 'react';

const MIN_LOOP_DURATION = 3 * 1000;
const MAX_LOOP_DURATION = 10 * 1000;
const DEFAULT_LOOP_DURATION = 5 * 1000;

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
	duration: number;
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
	duration,
}: PosterFramePickerProps ): React.ReactElement {
	const [ timestamp, setTimestamp ] = useState( atTime );
	const playerWrapperRef = useRef< HTMLDivElement >( null );

	const url = getVideoPressUrl( guid, {
		autoplay: true, // Set `autoplay` and `muted` true to be able to control the video.
		muted: true,
		controls: false,
		loop: false,
	} );

	const { preview = { html: null }, isRequestingEmbedPreview } = usePreview( url );
	const { html } = preview;

	const { playerIsReady, pause } = useVideoPlayer( playerWrapperRef, isRequestingEmbedPreview, {
		initialTimePosition: atTime,
	} );

	useEffect( () => {
		if ( ! playerIsReady ) {
			return;
		}
		pause();
	}, [ playerIsReady, pause ] );

	const onTimestampDebounceChange = useCallback(
		iframeTimePosition => {
			const sandboxIFrameWindow = getIframeWindowFromRef( playerWrapperRef );
			sandboxIFrameWindow?.postMessage( {
				event: 'videopress_action_set_currenttime',
				currentTime: iframeTimePosition / 1000,
			} );
			onVideoFrameSelect( iframeTimePosition );
		},
		[ getIframeWindowFromRef, onVideoFrameSelect ]
	);

	return (
		<div className="poster-panel__frame-picker">
			<div
				ref={ playerWrapperRef }
				className={ clsx( 'poster-panel__frame-picker__sandbox-wrapper', {
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
				fineAdjustment={ 50 }
				onChange={ setTimestamp }
				onDebounceChange={ onTimestampDebounceChange }
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
	onPreviewAtTimeChange: ( timestamp: number ) => void;
	onLoopDurationChange: ( duration: number ) => void;
};

/**
 * React component to select the video preview options when the user hovers the video
 *
 * @param {VideoHoverPreviewControlProps} props - Component properties
 * @returns { React.ReactElement}                 React component
 */
export function VideoHoverPreviewControl( {
	previewOnHover = false,
	previewAtTime = 0,
	loopDuration = DEFAULT_LOOP_DURATION,
	videoDuration,
	onPreviewOnHoverChange,
	onPreviewAtTimeChange,
	onLoopDurationChange,
}: VideoHoverPreviewControlProps ): React.ReactElement {
	const disabled = ! videoDuration;
	const maxStartingPoint = Math.max( videoDuration - MIN_LOOP_DURATION, 0 );

	const [ maxLoopDuration, setMaxLoopDuration ] = useState(
		Math.min( MAX_LOOP_DURATION, videoDuration - previewAtTime )
	);

	const maxLoopDurationSeconds = ( ( maxLoopDuration / 10 ) | 0 ) / 100;

	const startingPointHelp = createInterpolateElement(
		sprintf(
			/* translators: placeholder is video duration */
			__( 'Video duration: <em>%s</em>.', 'jetpack-videopress-pkg' ),
			millisecondsToClockTime( videoDuration )
		),
		{
			em: <em />,
		}
	);

	const loopDurationHelp = createInterpolateElement(
		sprintf(
			/* translators: placeholders are the minimum and maximum lapse duration for the previewOnHover, in seconds */
			__( 'Minimum: <em>%1$ss</em>. Maximum: <em>%2$ss</em>.', 'jetpack-videopress-pkg' ),
			Math.min( MIN_LOOP_DURATION / 1000, maxLoopDurationSeconds ),
			maxLoopDurationSeconds
		),
		{
			em: <em />,
		}
	);

	const noStartingPointRange = maxStartingPoint === 0;
	const noLoopDurationRange = maxLoopDuration <= MIN_LOOP_DURATION;

	const onStartingPointDebounceChange = useCallback(
		( timestamp: number ) => {
			onPreviewAtTimeChange( timestamp );

			const max = Math.min( MAX_LOOP_DURATION, videoDuration - timestamp );
			setMaxLoopDuration( max );

			// Adjust loop duration if needed
			if ( loopDuration > max ) {
				onLoopDurationChange( max );
			}
		},
		[ onPreviewAtTimeChange, videoDuration, loopDuration, onLoopDurationChange ]
	);

	return (
		<>
			<ToggleControl
				className="poster-panel__preview-toggle"
				label={ __( 'Video preview on hover', 'jetpack-videopress-pkg' ) }
				checked={ previewOnHover }
				onChange={ onPreviewOnHoverChange }
				disabled={ ! previewOnHover && disabled }
			/>

			{ previewOnHover && (
				<>
					<TimestampControl
						label={ __( 'Starting point', 'jetpack-videopress-pkg' ) }
						max={ maxStartingPoint }
						fineAdjustment={ 50 }
						value={ previewAtTime }
						onDebounceChange={ onStartingPointDebounceChange }
						wait={ 300 }
						disabled={ disabled || noStartingPointRange }
						help={ startingPointHelp }
					/>

					<TimestampControl
						max={ maxLoopDuration }
						min={ MIN_LOOP_DURATION }
						fineAdjustment={ 50 }
						label={ __( 'Loop duration', 'jetpack-videopress-pkg' ) }
						value={ loopDuration }
						onDebounceChange={ onLoopDurationChange }
						wait={ 300 }
						help={ loopDurationHelp }
						disabled={ disabled || noLoopDurationRange }
						marksEvery={ 1000 }
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
	videoBelongToSite,
}: PosterPanelProps ): React.ReactElement {
	const { poster, posterData } = attributes;

	const videoDuration = attributes?.duration;

	const pickPosterFromFrame = posterData?.type === 'video-frame';
	const previewOnHover = posterData?.previewOnHover || false;
	const previewAtTime = posterData?.previewAtTime ?? posterData?.atTime ?? 0;
	let previewLoopDuration = posterData?.previewLoopDuration ?? DEFAULT_LOOP_DURATION;

	if ( previewLoopDuration > videoDuration - previewAtTime ) {
		previewLoopDuration = videoDuration - previewAtTime;
	}

	const onRemovePoster = () => {
		setAttributes( { poster: '', posterData: { ...attributes.posterData, url: '' } } );
	};

	const switchPosterSource = useCallback(
		( shouldPickFromFrame: boolean ) => {
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
			let newPosterData: PosterDataProps = {
				...attributes.posterData,
				previewOnHover: shouldPreviewOnHover,
			};

			// Add default values for the preview options on activation
			if ( shouldPreviewOnHover ) {
				newPosterData = {
					previewAtTime,
					previewLoopDuration,
					...newPosterData,
				};
			}

			setAttributes( {
				posterData: newPosterData,
				controls: shouldPreviewOnHover ? false : attributes.controls,
			} );
		},
		[ attributes ]
	);

	const onPreviewAtTimeChange = useCallback(
		( atTime: number ) => {
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
			let previewStart = previewAtTime;

			// Adjust the starting point if the loop duration is too long
			if ( previewAtTime + loopDuration > videoDuration ) {
				previewStart = videoDuration - loopDuration;
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

	const onVideoFrameSelect = ( timestamp: number ) => {
		setAttributes( {
			posterData: {
				...attributes.posterData,
				type: 'video-frame',
				atTime: timestamp,
			},
			poster: '',
		} );
	};

	const panelTitle = isVideoFramePosterEnabled()
		? __( 'Poster and preview', 'jetpack-videopress-pkg' )
		: __( 'Poster', 'jetpack-videopress-pkg' );

	return (
		<PanelBody title={ panelTitle } className="poster-panel" initialOpen={ false }>
			<ToggleControl
				label={ __( 'Pick from video frame', 'jetpack-videopress-pkg' ) }
				checked={ pickPosterFromFrame && videoBelongToSite }
				onChange={ switchPosterSource }
				disabled={ ! videoBelongToSite }
			/>

			<div
				className={ clsx( 'poster-panel__frame-wrapper', {
					'is-selected': pickPosterFromFrame,
				} ) }
			>
				<VideoFramePicker
					isGeneratingPoster={ isGeneratingPoster }
					guid={ attributes?.guid }
					atTime={ posterData?.atTime }
					duration={ videoDuration }
					onVideoFrameSelect={ onVideoFrameSelect }
				/>
			</div>

			<div
				className={ clsx( 'poster-panel__image-wrapper', {
					'is-selected': ! pickPosterFromFrame,
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

			{ isVideoFramePosterEnabled() && (
				<VideoHoverPreviewControl
					previewOnHover={ previewOnHover }
					previewAtTime={ previewAtTime }
					loopDuration={ previewLoopDuration }
					videoDuration={ videoDuration }
					onPreviewOnHoverChange={ onPreviewOnHoverChange }
					onPreviewAtTimeChange={ onPreviewAtTimeChange }
					onLoopDurationChange={ onLoopDurationChange }
				/>
			) }
		</PanelBody>
	);
}
