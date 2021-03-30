/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import getColorAndStyleProps from './color-props';

export default function save( { attributes } ) {
	const { borderRadius, text, align } = attributes;
	const colorProps = getColorAndStyleProps( attributes );
	const containerClasses = classnames(
		'wp-block-button',
		'wp-block-premium-content-login-button',
		{ alignleft: align === 'left' },
		{ aligncenter: align === 'center' },
		{ alignright: align === 'right' }
	);
	const buttonClasses = classnames( 'wp-block-button__link', colorProps.className, {
		'no-border-radius': borderRadius === 0,
	} );
	const buttonStyle = {
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		...colorProps.style,
	};
	return (
		// eslint-disable-next-line wpcalypso/jsx-classname-namespace
		<div className={ containerClasses }>
			<RichText.Content
				tagName="a"
				className={ buttonClasses }
				style={ buttonStyle }
				value={ text }
			/>
		</div>
	);
}
