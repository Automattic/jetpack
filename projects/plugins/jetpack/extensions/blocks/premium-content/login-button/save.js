import { RichText, useBlockProps } from '@wordpress/block-editor';
import classnames from 'classnames';
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
	const blockProps = useBlockProps.save( {
		className: containerClasses,
	} );

	return (
		// eslint-disable-next-line wpcalypso/jsx-classname-namespace
		<div { ...blockProps }>
			<RichText.Content
				tagName="a"
				className={ buttonClasses }
				style={ buttonStyle }
				value={ text }
			/>
		</div>
	);
}
