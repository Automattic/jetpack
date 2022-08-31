import { QRCodeCanvas } from 'qrcode.react';
import type React from 'react';

type QRCodeLibProps = React.ComponentProps< typeof QRCodeCanvas >;

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
	size = 248,
} ) => {
	return (
		<QRCodeCanvas
			value={ value }
			size={ size }
			bgColor={ bgColor }
			fgColor={ fgColor }
			level={ level }
			includeMargin={ includeMargin }
			imageSettings={ imageSettings }
		/>
	);
};

export default QRCode;
