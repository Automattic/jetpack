import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import type { ComponentProps, FC, ReactNode } from 'react';

type QRCodeCanvasProps = ComponentProps< typeof QRCodeCanvas >;
type QRCodeSVGProps = ComponentProps< typeof QRCodeSVG >;

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
	level?: QRCodeCanvasProps[ 'level' ] | QRCodeSVGProps[ 'level' ];

	/**
	 * Whether to include margin in the QR code.
	 */
	includeMargin?: boolean;

	/**
	 * Render the QR code as a `canvas` or `svg`.
	 */
	renderAs?: 'canvas' | 'svg';

	/**
	 * Size of the QR code.
	 */
	size?: number;

	/**
	 * Image settings for the QR code.
	 */
	imageSettings?: QRCodeCanvasProps[ 'imageSettings' ] | QRCodeSVGProps[ 'imageSettings' ];
};

/**
 * Renders a QR Code.
 *
 * @param {QRCodeProps} props - Component props
 * @return {ReactNode} - React component.
 */
const QRCode: FC< QRCodeProps > = ( {
	value = 'https://jetpack.com',
	size = 248,
	bgColor,
	fgColor,
	level,
	includeMargin,
	imageSettings,
	renderAs = 'canvas',
} ) => {
	const commonProps = {
		value,
		size,
		bgColor,
		fgColor,
		level,
		includeMargin,
		imageSettings,
	};
	return renderAs === 'svg' ? (
		<QRCodeSVG { ...commonProps } />
	) : (
		<QRCodeCanvas { ...commonProps } />
	);
};

export default QRCode;
