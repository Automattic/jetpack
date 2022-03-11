/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Component, Button, Modal } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { JetpackLogo, QRCode } from '@automattic/jetpack-components';

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
export function QRPost() {
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
				size={ 300 }
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

export function QRPostButton() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const switchModal = () => setIsModalOpen( v => ! v );
	const closeModal = () => setIsModalOpen( false );

	return (
		<div className="qr-post-button">
			<Button
				isSecondary
				onClick={ switchModal }
				help={ __(
					'Get advantage of the QR code to open the post in different devices, on the fly.',
					'jetpack'
				) }
			>
				{ __( 'Get QR code', 'jetpack' ) }
			</Button>

			{ isModalOpen && (
				<Modal title={ __( 'QR Post code', 'jetpack' ) } onRequestClose={ closeModal }>
					<QRPost />

					<Button variant="secondary" isSmall onClick={ closeModal }>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</Modal>
			) }
		</div>
	);
}
