/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	getColorClassName,
	__experimentalGetGradientClass as getGradientClass,
	RichText,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
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
	} = attributes;

	if ( ! saveInPostContent ) {
		return null;
	}

	const backgroundClass = getColorClassName( 'background-color', backgroundColor );
	const gradientClass = IS_GRADIENT_AVAILABLE ? getGradientClass( gradient ) : undefined;
	const textClass = getColorClassName( 'color', textColor );

	const blockClasses = classnames( 'wp-block-button', 'jetpack-submit-button', className, {
		[ `wp-block-jetpack-${ blockName }` ]: blockName,
	} );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ textClass ]: textClass,
		'has-background': backgroundColor || gradient || customBackgroundColor || customGradient,
		[ backgroundClass ]: backgroundClass,
		[ gradientClass ]: gradientClass,
		'no-border-radius': 0 === borderRadius,
		[ `has-custom-width wp-block-button__width-${ width }` ]: width,
	} );

	const buttonStyle = {
		background: customGradient || undefined,
		backgroundColor:
			backgroundClass || customGradient || gradient ? undefined : customBackgroundColor,
		color: textClass ? undefined : customTextColor,
		borderRadius: borderRadius ? borderRadius + 'px' : undefined,
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
