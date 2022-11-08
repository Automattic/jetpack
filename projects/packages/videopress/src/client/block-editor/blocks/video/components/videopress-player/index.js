/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { ResizableBox, SandBox } from '@wordpress/components';
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import vpBlockBridge from '../../scripts/vp-block-bridge';

// Global scripts array to be run in the Sandbox context.
const globalScripts = [];

// Populate scripts array with videopresAjaxURLBlob blobal var.
if ( window.videopressAjax ) {
	const videopresAjaxURLBlob = new Blob(
		[ `var videopressAjax = ${ JSON.stringify( window.videopressAjax ) };` ],
		{
			type: 'text/javascript',
		}
	);

	globalScripts.push(
		URL.createObjectURL( videopresAjaxURLBlob ),
		window.videopressAjax.bridgeUrl
	);
}

// Define a debug instance for block bridge.
window.debugBridgeInstance = debugFactory( 'jetpack:vp-block:bridge' );

// Load VideoPressBlock bridge script.
globalScripts.push( vpBlockBridge );

/**
 * VideoPlayer react component
 *
 * @param {object} props                 - Component props.
 * @param {object} props.html            - Player html to render in the sandbox.
 * @param {boolean} props.isSelected     - Whether the block is selected.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {Array} props.scripts          - Scripts to pass trough to the sandbox.
 * @param {object} props.preview         - oEmbed preview data.
 * @param {boolean} props.isRequestingEmbedPreview - oEmbed preview data.
 * @returns {object}                     - React component.
 */
export default function VideoPressPlayer( {
	html,
	isSelected,
	attributes,
	setAttributes,
	scripts = [],
	preview,
	isRequestingEmbedPreview,
} ) {
	const mainWrapperRef = useRef();
	const videoWrapperRef = useRef();
	const { maxWidth, caption, videoRatio } = attributes;

	/*
	 * Temporary height is used to set the height of the video
	 * as soon as the block is rendered into the canvas
	 * while the preview fetching process is happening,
	 * trying to reduce the flicker effects as much as possible.
	 * Once the preview is fetched, the temporary height is ignored.
	 */
	const [ videoPlayerTemporaryHeight, setVideoPlayerTemporaryHeightState ] = useState();

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
		if ( preview ) {
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
			return;
		}

		setIsVideoPlayerLoaded( false );
	}, [ html ] );

	/*
	 * Callback state handler for the video player
	 * tied to the `onVideoPressLoadingState` event,
	 * provided by the videopress player through the bridge.
	 */
	const onVideoLoadingStateHandler = useCallback( ( { detail } ) => {
		setIsVideoPlayerLoaded( detail?.state === 'loaded' );
	}, [] );

	// Listen to the `onVideoPressLoadingState` event.
	useEffect( () => {
		if ( ! window ) {
			return;
		}

		window.addEventListener( 'onVideoPressLoadingState', onVideoLoadingStateHandler );

		return () =>
			window?.removeEventListener( 'onVideoPressLoadingState', onVideoLoadingStateHandler );
	}, [ onVideoLoadingStateHandler, window, html ] );

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

	const wrapperElementStyle = {};
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
					left: true,
					right: true,
				} }
				maxWidth="100%"
				size={ { width: maxWidth } }
				style={ { margin: 'auto' } }
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
						{ ! isRequestingEmbedPreview && (
							<SandBox html={ html } scripts={ [ ...globalScripts, ...scripts ] } />
						) }

						{ ! isVideoPlayerLoaded && (
							<div className="jetpack-videopress-player__loading">
								{ __( 'Loading…', 'jetpack-videopress-pkg' ) }
							</div>
						) }
					</>
				</div>
			</ResizableBox>

			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…', 'jetpack-videopress-pkg' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
}
