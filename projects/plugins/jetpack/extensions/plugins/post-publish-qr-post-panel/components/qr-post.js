/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Component } from '@wordpress/components';
import { JetpackLogo, QRCode } from '@automattic/jetpack-components';
import { useRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSiteLogo from '../hooks/use-site-logo.js';

/**
 * React component that renders a QR code for the post,
 * pulling the post data from the editor store.
 *
 * @returns {Component}   The react component.
 */
export default function QRPost() {
	const wrapperElementRef = useRef();

	// Pick and convert Jetpack logo to data image.
	const [ jetpackLogoUrl, setJetpackLogo ] = useState();
	useEffect( () => {
		if ( ! wrapperElementRef?.current ) {
			return;
		}

		const svgJetpackLogo = wrapperElementRef.current.querySelector( 'svg' );
		if ( ! svgJetpackLogo ) {
			return;
		}

		const serializedSVG = new XMLSerializer().serializeToString( svgJetpackLogo );
		setJetpackLogo( `data:image/svg+xml;base64,${ window.btoa( serializedSVG ) }` );
	}, [ wrapperElementRef ] );

	// Pick title and permalink post.
	const permalink = useSelect( select => select( editorStore ).getPermalink(), [] );
	const { dataUrl: siteLogoUrl } = useSiteLogo( { generateDataUrl: true } );
	const codeLogo = siteLogoUrl || jetpackLogoUrl;

	return (
		<div ref={ wrapperElementRef }>
			<QRCode
				value={ permalink }
				size={ 238 }
				imageSettings={
					codeLogo && {
						src: codeLogo,
						width: 48,
						height: 48,
						excavate: true,
					}
				}
				renderAs="canvas"
				level="H"
			/>

			<JetpackLogo className="qr-post-jetpack-logo" width={ 48 } height={ 48 } showText={ false } />
		</div>
	);
}
