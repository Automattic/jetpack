import { SVG } from '@wordpress/components';
import { renderToString } from 'react-dom/server';

/**
 * Icon is used in the block Placeholder.
 */
export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
		<text y="13" fontFamily="sans-serif" fontSize="11">
			𝑓(𝑥)
		</text>
	</SVG>
);

/**
 * String icon is needed for the block inserter.
 */
export const iconString = renderToString( icon );
