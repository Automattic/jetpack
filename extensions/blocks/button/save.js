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

const ButtonSave = ( { attributes, blockName, uniqueId } ) => {
	const {
		backgroundColor,
		borderRadius,
		gradient,
		text,
		textColor,
		url,
		className,
		customBackgroundColor,
		customGradient,
		customTextColor,
	} = attributes;

	const buttonBackgroundClass = getColorClassName( 'background-color', backgroundColor );
	const buttonGradientClass = IS_GRADIENT_AVAILABLE ? getGradientClass( gradient ) : undefined;
	const buttonTextClass = getColorClassName( 'color', textColor );

	const blockClasses = classnames( 'wp-block-button', 'jetpack-submit-button', className, {
		[ `wp-block-jetpack-${ blockName }` ]: blockName,
	} );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': textColor || customTextColor,
		[ buttonTextClass ]: buttonTextClass,
		'has-background': backgroundColor || gradient || customBackgroundColor || customGradient,
		[ buttonBackgroundClass ]: buttonBackgroundClass,
		[ buttonGradientClass ]: buttonGradientClass,
		'no-border-radius': 0 === borderRadius,
	} );

	const buttonStyle = {
		background: customGradient || undefined,
		backgroundColor:
			buttonBackgroundClass || customGradient || gradient ? undefined : customBackgroundColor,
		color: buttonTextClass ? undefined : customTextColor,
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
};

export default ButtonSave;
