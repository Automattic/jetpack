/**
 * External dependencies
 */
import React from 'react';
import QRCodeLib from 'qrcode.react';

/**
 * QRCode is a react component.
 *
 * @param {object} props                          - Component props.
 * @param {string} props.value                    - The value to encode.
 * @param {string} props.bgColor                  - Background color of the QR code.
 * @param {string} props.fgColor                  - Foreground color of the QR code.
 * @param {string} props.level                    - Error correction level of the QR code.
 * @param {boolean} props.includeMargin           - Whether to include margin in the QR code.
 * @param {string} props.renderAs	              - Render the QR code as a `canvas` or `svg`.
 * @param {number} props.size                     - Size of the QR code.
 * @param {object} props.imageSettings            - Image settings for the QR code.
 * @returns {React.Component}                     - React component.
 */
export default function QRCode( {
	value = 'https://jetpack.com',
	bgColor,
	fgColor,
	level,
	includeMargin,
	imageSettings,
	renderAs = 'canvas',
	size = 248,
} ) {
	return (
		<QRCodeLib
			value={ value }
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
