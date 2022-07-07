/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { ResizableBox, SandBox } from '@wordpress/components';
import { useCallback, useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import vpBlockBridge from '../../scripts/vp-block-bridge';

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

	useEffect( () => {
		window.addEventListener( 'onVideoPressPlaying', event => {
			console.log( 'video is playing...' );
			console.log( 'event: ', event?.detail );
		} );
	}, [] );

	useEffect( () => {
		if ( ! ref?.current ) {
			return;
		}

		const sandboxIFrame = ref.current.querySelector( 'iframe' );
		console.log( 'sandboxIFrame: ', sandboxIFrame );

		const sandboxWindowContent = sandboxIFrame?.contentWindow;
		if ( ! sandboxWindowContent ) {
			return;
		}

		setTimeout( () => {
			sandboxWindowContent.postMessage( {
				event: 'videopress_action_play',
			} );
		}, 5000 );
	}, [ ref ] );

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

		setTemporaryHeight( ( ref.current.offsetWidth * videoRatio ) / 100 );
	}, [ ref, setTemporaryHeight, temporaryHeight, videoRatio, preview ] );

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

	// Populate scripts array with videopresAjaxURLBlob blobal var.
	if ( window.videopressAjax ) {
		const videopresAjaxURLBlob = new Blob(
			[ `var videopressAjax = ${ JSON.stringify( window.videopressAjax ) };` ],
			{
				type: 'text/javascript',
			}
		);

		scripts.push( URL.createObjectURL( videopresAjaxURLBlob ), window.videopressAjax.bridgeUrl );
	}

	// Load VideoPressBlock bridge script.
	scripts.push( vpBlockBridge );

	const style = {};
	if ( temporaryHeight !== 'auto' ) {
		style.height = temporaryHeight;
		style.paddingBottom = 12;
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
					<SandBox html={ html } scripts={ scripts } />
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
