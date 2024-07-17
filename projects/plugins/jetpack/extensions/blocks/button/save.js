import {
	getColorClassName,
	__experimentalGetGradientClass as getGradientClass, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	RichText,
} from '@wordpress/block-editor';
import clsx from 'clsx';
import { IS_GRADIENT_AVAILABLE } from './constants';

export default function ButtonSave( { attributes, blockName, uniqueId } ) {
	const {
		backgroundColor,
		borderRadius,
		className,
		customBackgroundColor,
		customGradient,
		customTextColor,
		gradient,
		saveInPostContent,
		text,
		textColor,
		url,
		width,
		fontSize,
	} = attributes;

	if ( ! saveInPostContent ) {
		return null;
	}

	const backgroundClass = getColorClassName( 'background-color', backgroundColor );
	const gradientClass = IS_GRADIENT_AVAILABLE ? getGradientClass( gradient ) : undefined;
	const textClass = getColorClassName( 'color', textColor );

	const blockClasses = clsx( 'wp-block-button', 'jetpack-submit-button', className, {
		[ `wp-block-jetpack-${ blockName }` ]: blockName,
	} );

	const buttonClasses = clsx( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || gradient || customBackgroundColor || customGradient,
		[ backgroundClass ]: backgroundClass,
		[ gradientClass ]: gradientClass,
		'no-border-radius': 0 === borderRadius,
		'has-custom-width': !! width,
		[ `has-${ fontSize }-font-size` ]: !! fontSize,
		'has-custom-font-size': !! fontSize,
	} );

	const buttonStyle = {
		background: customGradient || undefined,
		backgroundColor:
			backgroundClass || customGradient || gradient ? undefined : customBackgroundColor,
		fontSize: attributes.style?.typography?.fontSize,
		color: textClass ? undefined : customTextColor,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
		width,
	};

	return (
		<div className={ blockClasses }>
			<RichText.Content
				className={ buttonClasses }
				data-id-attr={ uniqueId || 'placeholder' }
				href={ url }
				id={ uniqueId }
				rel="noopener noreferrer"
				role="button"
				style={ buttonStyle }
				tagName="a"
				target="_blank"
				value={ text }
			/>
		</div>
	);
}
