import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Icon, people, wordpress } from '@wordpress/icons';
import type { Product } from '../types';

const SIZE = 20;

const Disc = ( {
	color,
	size,
	children,
}: {
	color: string;
	size: number;
	children: React.ReactNode;
} ) => (
	<span
		aria-hidden="true"
		className="jetpack-flow-disc"
		style={ { background: color, width: size, height: size } }
	>
		{ children }
	</span>
);

/** Brand marks for the products Flow connects. Decorative: the label next to them names the product. */
export function ProductIcon( { product, size = SIZE }: { product: Product; size?: number } ) {
	switch ( product ) {
		case 'jetpack':
			return <JetpackLogo showText={ false } height={ size } />;
		case 'woocommerce':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#7f54b3" />
					<path
						fill="#fff"
						transform="translate(2.4 2.4) scale(.8)"
						d="M5.96 8.48c-.78 0-1.17.37-1.17 1.04s.42 1.05 1.18 1.05h.84v4.01c0 1.13.76 1.8 1.87 1.8.89 0 1.6-.44 2.14-1.45l1.2-2.24v1.9c0 1.12.73 1.79 1.85 1.79.88 0 1.53-.38 2.15-1.45l2.76-4.66c.6-1.02.18-1.79-1.15-1.79-.71 0-1.18.23-1.6 1.01l-1.9 3.57V9.89c0-.95-.45-1.41-1.29-1.41-.66 0-1.19.29-1.59 1.08l-1.79 3.5V9.92c0-1.01-.42-1.44-1.43-1.44H5.96Z"
					/>
				</svg>
			);
		case 'mailpoet':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#ff5301" />
					<path
						fill="#fff"
						transform="translate(3.6 3.6) scale(.0536)"
						d="M37.71,89.1c3.5,0,5.9-.8,7.2-2.3a8,8,0,0,0,2-5.4V35.7l17,45.1a12.68,12.68,0,0,0,3.7,5.4c1.6,1.3,4,2,7.2,2a12.54,12.54,0,0,0,5.9-1.4,8.41,8.41,0,0,0,3.9-5l18.1-50V81a8.53,8.53,0,0,0,2.1,6.1c1.4,1.4,3.7,2.2,6.9,2.2,3.5,0,5.9-.8,7.2-2.3a8,8,0,0,0,2-5.4V8.7a7.48,7.48,0,0,0-3.3-6.6c-2.1-1.4-5-2.1-8.6-2.1a19.3,19.3,0,0,0-9.4,2,11.63,11.63,0,0,0-5.1,6.8L74.91,67.1,54.41,8.4a12.4,12.4,0,0,0-4.5-6.2c-2.1-1.5-5-2.2-8.8-2.2a16.51,16.51,0,0,0-8.9,2.1c-2.3,1.5-3.5,3.9-3.5,7.2V80.8c0,2.8.7,4.8,2,6.2C32.21,88.4,34.41,89.1,37.71,89.1Z"
					/>
				</svg>
			);
		case 'akismet':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#357b49" />
					<path
						fill="#fff"
						fillRule="evenodd"
						d="M12 6 18 18h-2.4l-1.2-2.8H9.6L8.4 18H6L12 6Zm0 4.2-1.5 3.4h3L12 10.2Z"
					/>
				</svg>
			);
		case 'crm':
			return (
				<Disc color="#1e1e1e" size={ size }>
					<Icon icon={ people } size={ Math.round( size * 0.7 ) } fill="#fff" />
				</Disc>
			);
		default:
			return (
				<Disc color="#2c3338" size={ size }>
					<Icon icon={ wordpress } size={ Math.round( size * 0.75 ) } fill="#fff" />
				</Disc>
			);
	}
}
