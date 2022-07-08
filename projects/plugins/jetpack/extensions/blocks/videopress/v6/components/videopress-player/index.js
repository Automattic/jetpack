/**
 * External dependencies
 */
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { Button, Panel, PanelBody, ResizableBox, SandBox } from '@wordpress/components';
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import vpBlockBridge from '../../scripts/vp-block-bridge';

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

// Load VideoPressBlock bridge script.
globalScripts.push( vpBlockBridge );

export default function VideoPressPlayer( {
	html,
	isSelected,
	attributes,
	setAttributes,
	scripts = [],
	thumbnail,
	preview,
} ) {
	const ref = useRef();
	const { maxWidth, caption, videoRatio } = attributes;

	function dispatchVideoPressAction( action ) {
		const sandboxIFrame = ref?.current?.querySelector( 'iframe' );
		const sandboxWindowContent = sandboxIFrame?.contentWindow;
		if ( ! sandboxWindowContent ) {
			return;
		}
		sandboxWindowContent.postMessage( {
			event: action,
		} );
	}
	const playVideo = useCallback( () => {
		dispatchVideoPressAction( 'vpblock_action_play' );
	}, [] );

	const pauseVideo = useCallback( () => {
		dispatchVideoPressAction( 'vpblock_action_pause' );
	}, [] );

	/*
	 * Temporary height is used to set the height of the video
	 * as soon as the block is rendered into the canvas,
	 * while the preview fetching process is happening,
	 * trying to remove the flicker effect.
	 *
	 * Once the preview is fetched, the temporary heihgt is ignored.
	 */
	const [ temporaryHeight, setTemporaryHeight ] = useState();
	useEffect( () => {
		if ( ! ref?.current ) {
			return;
		}

		if ( temporaryHeight === 'auto' ) {
			return;
		}

		if ( preview ) {
			return setTemporaryHeight( 'auto' );
		}

		// Wrapper element is used to set the height of block,
		// when the preview is not ready to use.
		const wrapperDOMReference = ref.current.querySelector( '.jetpack-videopress-player__wrapper' );
		if ( ! wrapperDOMReference ) {
			return;
		}

		setTemporaryHeight( ( wrapperDOMReference.offsetWidth * videoRatio ) / 100 );
	}, [ ref, setTemporaryHeight, temporaryHeight, videoRatio, preview ] );

	// Autoplay when hovering the video.
	useEffect( () => {
		if ( ! ref?.current ) {
			return;
		}

		const mainWrapper = ref.current;
		mainWrapper.addEventListener( 'mouseenter', playVideo );
		mainWrapper.addEventListener( 'mouseleave', pauseVideo );

		return function () {
			mainWrapper.removeEventListener( 'mouseenter', playVideo );
			mainWrapper.removeEventListener( 'mouseleave', pauseVideo );
		};
	}, [ pauseVideo, playVideo, preview ] );

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
		style.height = temporaryHeight;
		style.paddingBottom = 12;
	}

	return (
		<figure className="jetpack-videopress-player" ref={ ref }>
			<InspectorControls>
				<Panel>
					<PanelBody title={ __( 'VideoPress Player', 'jetpack' ) } initialOpen={ true }>
						<Button
							variant="primary"
							className="jetpack-videopress-player__button"
							onClick={ () => {
								pauseVideo();
							} }
						>
							{ __( 'Pause', 'jetpack' ) }
						</Button>
					</PanelBody>
				</Panel>
			</InspectorControls>

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
					<img
						src={ thumbnail }
						alt={ __( 'Video thumbnail', 'jetpack' ) }
						className="jetpack-videopress-player__thumbnail"
					/>
				</div>
			</ResizableBox>

			{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
				<RichText
					tagName="figcaption"
					placeholder={ __( 'Write caption…', 'jetpack' ) }
					value={ caption }
					onChange={ value => setAttributes( { caption: value } ) }
					inlineToolbar
				/>
			) }
		</figure>
	);
}
