/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * JetpackSymbol component definition.
 *
 * @param {object} props - Component properties.
 * @param {object} props.color - Color of the logo, default: '#00BE28' - green.
 * @param {object} props.className - className default: `jetpack-symbol`.
 * @param {number} props.height - Height for SVG, default: 16
 *
 * @returns {React.Component} JetpackSymbol component.
 */
export default function JetpackSymbol( {
	color = '#00BE28',
	className = '',
	height = 16,
	...otherProps
} ) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			x="0px"
			y="0px"
			viewBox="0 0 32 32"
			aria-labelledby="jp-jetpack-symbol-title"
			className={ classnames( 'jetpack-symbol', className ) }
			height={ height }
			{ ...otherProps }
		>
			<title id="jp-jetpack-symbol-title">{ __( 'Jetpack Symbol', 'jetpack' ) }</title>
			<path
				fill={ color }
				d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"
			/>
		</svg>
	);
}
