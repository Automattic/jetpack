/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { ResizableBox, SandBox } from '@wordpress/components';
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
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
	const videoWrapperRef = useRef();
	const { maxWidth, caption, videoRatio } = attributes;

	/*
	 * Temporary height is used to set the height of the video
	 * as soon as the block is rendered into the canvas
	 * while the preview fetching process is happening,
	 * trying to reduce the flicker effects as much as possible.
	 * Once the preview is fetched, the temporary height is ignored.
	 */
	const [ temporaryHeight, setTemporaryHeight ] = useState();

	/*
	 * isVideoLoad registers the state
	 * when the video has been loaded in the videopress player.
	 */
	const [ isVideoPlayerLoaded, setIsVideoPlayerLoaded ] = useState( false );

	useEffect( () => {
		if ( ! videoWrapperRef?.current ) {
			return;
		}

		if ( preview ) {
			// Once the video is loaded, delegate the height to the player (iFrame)
			return setTemporaryHeight( 'auto' );
		}

		if ( ! videoRatio ) {
			return;
		}

		// When no preview is available, set the height of the video.
		setTemporaryHeight( ( videoWrapperRef.current.offsetWidth * videoRatio ) / 100 );

		setTimeout( () => {
			// Recalculated in case the sidebar is opened.
			setTemporaryHeight( ( videoWrapperRef.current.offsetWidth * videoRatio ) / 100 );
		}, 0 );

		/*
		 * Also, when no preview, consider the video is no loaded yet.
		 * note: videopress API does not provide
		 * the event to know when the video is not loaded.
		 */
		setIsVideoPlayerLoaded( false );
	}, [ videoWrapperRef, videoRatio, preview ] );

	// Set video is loaded as False, when html is not available.
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

			setTemporaryHeight( 'auto' );
			setAttributes( { maxWidth: newMaxWidth } );
		},
		[ setAttributes ]
	);

	const wrapperElementStyle = {};
	if ( temporaryHeight !== 'auto' ) {
		wrapperElementStyle.height = temporaryHeight || 200;
		wrapperElementStyle.paddingBottom = temporaryHeight ? 12 : 0;
	}

	return (
		<figure className="jetpack-videopress-player">
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
			>
				{ ! isSelected && <div className="jetpack-videopress-player__overlay" /> }

				<div
					className="jetpack-videopress-player__wrapper"
					ref={ videoWrapperRef }
					style={ wrapperElementStyle }
				>
					<>
						<div
							className={ classnames( 'jetpack-videopress-ghost-player', {
								'is-requesting-preview': isRequestingEmbedPreview,
								'video-has-been-loaded': isVideoPlayerLoaded,
							} ) }
						>
							<SandBox html={ html } />
						</div>

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
