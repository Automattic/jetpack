/**
 * External dependencies
 */
import React from 'react';
import QRCode from 'qrcode.react';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * QRPost is a react component that renders
 * a QR code for a post, pulling the post data
 * from the editor store.
 *
 * @param {object} props                          - Component props.
 * @param {string} props.bgColor                  - Background color of the QR code.
 * @param {string} props.fgColor                  - Foreground color of the QR code.
 * @param {string} props.level                    - Error correction level of the QR code.
 * @param {boolean} props.includeMargin           - Whether to include margin in the QR code.
 * @param {string} props.renderAs	              - Render the QR code as a `canvas` or `svg`.
 * @param {number} props.size                     - Size of the QR code.
 * @param {object} props.imageSettings            - Image settings for the QR code.
 * @returns {React.Component}                     - React component.
 */
export default function QRPost( {
	bgColor,
	fgColor,
	level,
	includeMargin,
	imageSettings,
	renderAs = 'canvas',
	size = 248,
} ) {
	const {
		post: { title: postTitle },
		permalink,
		edits: { title: editTitle },
	} = useSelect(
		select => ( {
			post: select( editorStore ).getCurrentPost(),
			slug: select( editorStore ).getEditedPostSlug(),
			permalink: select( editorStore ).getPermalink(),
			edits: select( editorStore ).getPostEdits(),
		} ),
		[]
	);

	// Post title: edited value or current one.
	const title = editTitle || postTitle;

	return (
		<QRCode
			value={ `${ title } ${ permalink }` }
			size={ size }
			bgColor={ bgColor }
			fgColor={ fgColor }
			level={ level }
			includeMargin={ includeMargin }
			imageSettings={ imageSettings }
			renderAs={ renderAs }
		/>
	);
}
