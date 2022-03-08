/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { Component } from '@wordpress/components';
import { QRCode } from '@automattic/jetpack-components';

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
	const {
		post: { title },
		permalink,
	} = useSelect(
		select => ( {
			post: select( editorStore ).getCurrentPost(),
			permalink: select( editorStore ).getPermalink(),
		} ),
		[]
	);

	const codeContent = `${ title } ${ permalink }`;
	const { url: siteLogologoUrl } = useSiteLogo();

	return (
		<QRCode
			value={ codeContent }
			size={ 248 }
			imageSettings={
				siteLogologoUrl && {
					src: siteLogologoUrl,
					width: 48,
					height: 48,
					excavate: true,
				}
			}
			renderAs="canvas"
			level="H"
		/>
	);
}
