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
 * @returns {object}                     - React component.
 */
export default function VideoPressPlayer( {
	html,
	isSelected,
	attributes,
	setAttributes,
	scripts = [],
	preview,
} ) {
	const ref = useRef();
	const { maxWidth, caption, videoRatio } = attributes;

	// Pick up iFrame and sandbox window references.
	const iFrameDomReference = ref?.current?.querySelector( 'iframe' );
	const sandboxWindow = iFrameDomReference?.contentWindow;

	/*
	 * Temporary height is used to set the height of the video
	 * as soon as the block is rendered into the canvas,
	 * while the preview fetching process is happening,
	 * trying to reduce the flicker effects as much as possible
	 *
	 * Once the preview is fetched, the temporary heihgt is ignored.
	 */
	const [ temporaryHeight, setTemporaryHeight ] = useState();
	const [ isVideoLoaded, setIsVideoLoaded ] = useState( false );
	useEffect( () => {
		if ( ! ref?.current ) {
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
		setTemporaryHeight( ( ref.current.offsetWidth * videoRatio ) / 100 );

		setTimeout( () => {
			// Recalculated in case the sidebar is opened.
			setTemporaryHeight( ( ref.current.offsetWidth * videoRatio ) / 100 );
		}, 0 );

		/*
		 * Also, when no preview, consider the video is no loaded yet.
		 * note: videopress API does not provide
		 * the event to know when the video is not loaded.
		 */
		setIsVideoLoaded( false );
	}, [ ref, videoRatio, preview ] );

	const onVideoLoadingStateHandler = useCallback( ( { detail } ) => {
		setIsVideoLoaded( detail?.state === 'loaded' );
	}, [] );

	// set video is loaded as False, when html is not available.
	useEffect( () => {
		if ( html ) {
			return;
		}

		setIsVideoLoaded( false );
	}, [ html ] );

	useEffect( () => {
		if ( ! sandboxWindow ) {
			return;
		}

		sandboxWindow.addEventListener( 'onVideoPressLoadingState', onVideoLoadingStateHandler );

		return () =>
			sandboxWindow?.removeEventListener( 'onVideoPressLoadingState', onVideoLoadingStateHandler );
	}, [ onVideoLoadingStateHandler, sandboxWindow, html ] );

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

			setAttributes( { maxWidth: newMaxWidth } );
		},
		[ setAttributes ]
	);

	const style = {};
	if ( temporaryHeight !== 'auto' ) {
		style.height = temporaryHeight || 200;
		style.paddingBottom = temporaryHeight ? 12 : 0;
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
				<div className="jetpack-videopress-player__wrapper" ref={ ref } style={ style }>
					<SandBox html={ html } scripts={ [ ...globalScripts, ...scripts ] } />
					{ ! isVideoLoaded && (
						<div className="jetpack-videopress-player__loading">
							{ __( 'Loading…', 'jetpack-videopress-pkg' ) }
						</div>
					) }
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
