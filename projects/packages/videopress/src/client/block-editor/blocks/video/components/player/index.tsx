/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { ResizableBox, SandBox } from '@wordpress/components';
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import useVideoPlayer, { getIframeWindowFromRef } from '../../../../hooks/use-video-player';
import type { PlayerProps } from './types';
import type React from 'react';

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

	sandboxScripts.push(
		URL.createObjectURL( videopressAjaxURLBlob ),
		window.videopressAjax.bridgeUrl
	);
}

if ( window?.videoPressEditorState?.playerBridgeUrl ) {
	sandboxScripts.push( window.videoPressEditorState.playerBridgeUrl );
}

/**
 * VideoPlayer react component
 *
 * @param {PlayerProps} props  - Component props.
 * @returns {React.ReactElement} Playback block sidebar panel
 */
export default function Player( {
	showCaption,
	html,
	isSelected,
	attributes,
	setAttributes,
	preview,
	isRequestingEmbedPreview,
}: PlayerProps ): React.ReactElement {
	const mainWrapperRef = useRef< HTMLDivElement >();
	const videoWrapperRef = useRef< HTMLDivElement >();

	const { maxWidth, caption, videoRatio } = attributes;

	/*
	 * Temporary height is used to set the height of the video
	 * as soon as the block is rendered into the canvas
	 * while the preview fetching process is happening,
	 * trying to reduce the flicker effects as much as possible.
	 * Once the preview is fetched, the temporary height is ignored.
	 */
	const [ videoPlayerTemporaryHeight, setVideoPlayerTemporaryHeightState ] = useState<
		number | string
	>( 400 );

	// todo: figure out why 12px are needed.
	const temporaryHeighErrorCorrection = 12;

	/**
	 * Helper to set the temporary height
	 * of the video player.
	 */
	function setVideoPlayerTemporaryHeight() {
		setVideoPlayerTemporaryHeightState(
			( videoWrapperRef.current.offsetWidth * videoRatio ) / 100 + temporaryHeighErrorCorrection
		);
	}

	/*
	 * isVideoPlayerLoaded registers the state
	 * when the video has been loaded in the videopress player.
	 */
	const [ isVideoPlayerLoaded, setIsVideoPlayerLoaded ] = useState( false );

	useEffect( () => {
		if ( ! videoWrapperRef?.current ) {
			return;
		}

		// Once the video is loaded, delegate the height to the player (iFrame)
		if ( preview.html ) {
			// Hack to mitigate the flickr when the player is
			setTimeout( () => {
				setVideoPlayerTemporaryHeightState( 'auto' );
			}, 250 );
			return;
		}

		if ( ! videoRatio ) {
			return;
		}

		// When no preview is available, set the height of the video.
		setVideoPlayerTemporaryHeight();

		setTimeout( () => {
			// Recalculated in case the sidebar is opened.
			setVideoPlayerTemporaryHeight();
		}, 0 );

		/*
		 * Also, when no preview, consider the video is no loaded yet.
		 * note: videopress API does not provide
		 * the event to know when the video is not loaded.
		 */
		setIsVideoPlayerLoaded( false );
	}, [ videoWrapperRef, videoRatio, preview ] );

	// Set video is loaded as False when `html` is not available.
	useEffect( () => {
		if ( html ) {
			setIsVideoPlayerLoaded( true );
			return;
		}

		setIsVideoPlayerLoaded( false );
	}, [ html ] );

	/*
	 * Function handler that listen to the `message` event
	 * provided by the videopress player through the bridge.
	 */
	const videoPlayerEventsHandler = useCallback( ( ev: MessageEvent ) => {
		const { data: eventData } = ev || {};
		const { event: eventName } = eventData;
		if ( eventName === 'videopress_loading_state' ) {
			setIsVideoPlayerLoaded( eventData?.state === 'loaded' );
		}
	}, [] );

	useEffect( () => {
		const iFrameContentWindow = getIframeWindowFromRef( videoWrapperRef );
		if ( ! iFrameContentWindow || isRequestingEmbedPreview ) {
			return;
		}

		// Listen to the `message` event.
		iFrameContentWindow.addEventListener( 'message', videoPlayerEventsHandler );

		return () => iFrameContentWindow?.removeEventListener( 'message', videoPlayerEventsHandler );
	}, [ videoWrapperRef, isRequestingEmbedPreview ] );

	const { atTime, previewOnHover, previewAtTime, previewLoopDuration, type } =
		attributes.posterData;

	let timeToSetPlayerPosition = undefined;
	if ( type === 'video-frame' ) {
		if ( previewOnHover ) {
			timeToSetPlayerPosition = previewAtTime;
		} else {
			timeToSetPlayerPosition = atTime;
		}
	} else {
		timeToSetPlayerPosition = atTime;
	}

	useVideoPlayer( videoWrapperRef, isRequestingEmbedPreview, {
		initialTimePosition: timeToSetPlayerPosition,
		autoplay: attributes.autoplay,
		wrapperElement: mainWrapperRef?.current,
		previewOnHover: previewOnHover
			? {
					atTime: previewAtTime,
					duration: previewLoopDuration,
			  }
			: undefined,
	} );

	useEffect( () => {
		if ( isRequestingEmbedPreview ) {
			setVideoPlayerTemporaryHeight();
		}
	}, [ isVideoPlayerLoaded, isRequestingEmbedPreview ] );

	const onBlockResize = useCallback(
		( event, direction, domElement ) => {
			let newMaxWidth = getComputedStyle( domElement ).width;
			const parentElement = domElement.parentElement;
			if ( null !== parentElement ) {
				const parentWidth = getComputedStyle( domElement.parentElement ).width;
				if ( newMaxWidth === parentWidth ) {
					newMaxWidth = '100%';
				}
			}

			setVideoPlayerTemporaryHeightState( 'auto' );
			setAttributes( { maxWidth: newMaxWidth } );
		},
		[ setAttributes ]
	);

	const wrapperElementStyle: {
		height?: number | string;
		paddingBottom?: number;
	} = {};

	// Focus the caption when we click to add one.
	const captionRef = useCallback(
		( node: HTMLElement ) => {
			if ( node && ! caption ) {
				node.focus();
			}
		},
		[ caption ]
	);

	if ( videoPlayerTemporaryHeight !== 'auto' ) {
		wrapperElementStyle.height = videoPlayerTemporaryHeight || 200;
		wrapperElementStyle.paddingBottom = videoPlayerTemporaryHeight
			? temporaryHeighErrorCorrection
			: 0;
	}

	return (
		<figure ref={ mainWrapperRef } className="jetpack-videopress-player">
			<ResizableBox
				enable={ {
					top: false,
					bottom: false,
					left: false,
					right: true,
				} }
				maxWidth="100%"
				size={ { width: maxWidth, height: 'auto' } }
				style={ { marginRight: 'auto' } }
				onResizeStop={ onBlockResize }
				onResizeStart={ () => setVideoPlayerTemporaryHeightState( 'auto' ) }
			>
				{ ! isSelected && <div className="jetpack-videopress-player__overlay" /> }

				<div
					className="jetpack-videopress-player__wrapper"
					ref={ videoWrapperRef }
					style={ wrapperElementStyle }
				>
					<>
						{ ! isRequestingEmbedPreview && <SandBox html={ html } scripts={ sandboxScripts } /> }

						{ ! isVideoPlayerLoaded && (
							<div className="jetpack-videopress-player__loading">
								{ __( 'Loading…', 'jetpack-videopress-pkg' ) }
							</div>
						) }
					</>
				</div>
			</ResizableBox>

			{ showCaption && ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					identifier="caption"
					tagName="figcaption"
					aria-label={ __( 'Video caption text', 'jetpack-videopress-pkg' ) }
					placeholder={ __( 'Add caption', 'jetpack-videopress-pkg' ) }
					value={ caption }
					onChange={ ( value: string ) => setAttributes( { caption: value } ) }
					inlineToolbar
					ref={ captionRef }
				/>
			) }
		</figure>
	);
}
