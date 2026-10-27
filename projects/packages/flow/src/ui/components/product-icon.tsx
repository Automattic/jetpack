import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Icon, wordpress } from '@wordpress/icons';
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
						fill="none"
						stroke="#fff"
						strokeWidth="2.4"
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M6.5 17V7.5L12 14l5.5-6.5V17"
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
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#069e08" />
					<circle cx="12" cy="9.2" r="3.2" fill="#fff" />
					<path fill="#fff" d="M5.8 18.4c0-3.2 2.8-5.2 6.2-5.2s6.2 2 6.2 5.2z" />
				</svg>
			);
		case 'sensei':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#43af99" />
					<path fill="#fff" d="M12 5.5L3.5 9.5 12 13.5l6.2-2.9v4.3h1.6V9.5z" />
					<path fill="#fff" d="M7 13.2v2.6c0 1.3 2.2 2.7 5 2.7s5-1.4 5-2.7v-2.6l-5 2.3z" />
				</svg>
			);
		case 'claude':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#d97757" />
					<path
						stroke="#fff"
						strokeWidth="2"
						strokeLinecap="round"
						d="M12 4.5v15M4.5 12h15M6.7 6.7l10.6 10.6M17.3 6.7L6.7 17.3"
					/>
				</svg>
			);
		case 'google-ai':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#4285f4" />
					<path
						fill="#fff"
						d="M12 3.5c.5 4.6 3.9 8 8.5 8.5-4.6.5-8 3.9-8.5 8.5-.5-4.6-3.9-8-8.5-8.5C8.1 11.5 11.5 8.1 12 3.5z"
					/>
				</svg>
			);
		case 'openai':
			return (
				<svg
					width={ size }
					height={ size }
					viewBox="0 0 24 24"
					aria-hidden="true"
					focusable="false"
				>
					<circle cx="12" cy="12" r="12" fill="#1e1e1e" />
					<path
						fill="none"
						stroke="#fff"
						strokeWidth="1.6"
						strokeLinejoin="round"
						d="M12 4.8l6.2 3.6v7.2L12 19.2l-6.2-3.6V8.4zM12 4.8v7.2m0 0l6.2 3.6M12 12l-6.2 3.6"
					/>
				</svg>
			);
		default:
			return (
				<Disc color="#2c3338" size={ size }>
					<Icon icon={ wordpress } size={ Math.round( size * 0.75 ) } fill="#fff" />
				</Disc>
			);
	}
}
