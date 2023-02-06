import QRCodeLib from 'qrcode.react';
import type React from 'react';

type QRCodeLibProps = React.ComponentProps< typeof QRCodeLib >;

export type QRCodeProps = {
	/**
	 * The value to encode.
	 */
	value?: string;

	/**
	 * Background color of the QR code.
	 */
	bgColor?: string;

	/**
	 * Foreground color of the QR code.
	 */
	fgColor?: string;

	/**
	 * Error correction level of the QR code.
	 */
	level?: QRCodeLibProps[ 'level' ];

	/**
	 * Whether to include margin in the QR code.
	 */
	includeMargin?: boolean;

	/**
	 * Render the QR code as a `canvas` or `svg`.
	 */
	renderAs?: QRCodeLibProps[ 'renderAs' ];

	/**
	 * Size of the QR code.
	 */
	size?: number;

	/**
	 * Image settings for the QR code.
	 */
	imageSettings?: QRCodeLibProps[ 'imageSettings' ];
};

/**
 * Renders a QR Code.
 *
 * @param {QRCodeProps} props - Component props
 * @returns {React.ReactNode} - React component.
 */
const QRCode: React.FC< QRCodeProps > = ( {
	value = 'https://jetpack.com',
	bgColor,
	fgColor,
	level,
	includeMargin,
	imageSettings,
	renderAs = 'canvas',
	size = 248,
} ) => {
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
};

export default QRCode;
