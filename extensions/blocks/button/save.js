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
		buttonBackgroundColor,
		buttonBorderRadius,
		buttonGradient,
		buttonText,
		buttonTextColor,
		buttonUrl,
		className,
		customButtonBackgroundColor,
		customButtonGradient,
		customButtonTextColor,
	} = attributes;

	const buttonBackgroundClass = getColorClassName( 'background-color', buttonBackgroundColor );
	const buttonGradientClass = IS_GRADIENT_AVAILABLE
		? getGradientClass( buttonGradient )
		: undefined;
	const buttonTextClass = getColorClassName( 'color', buttonTextColor );

	const blockClasses = classnames( 'wp-block-button', 'jetpack-submit-button', className, {
		[ `wp-block-jetpack-${ blockName }` ]: blockName,
	} );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-text-color': buttonTextColor || customButtonTextColor,
		[ buttonTextClass ]: buttonTextClass,
		'has-background':
			buttonBackgroundColor ||
			buttonGradient ||
			customButtonBackgroundColor ||
			customButtonGradient,
		[ buttonBackgroundClass ]: buttonBackgroundClass,
		[ buttonGradientClass ]: buttonGradientClass,
		'no-border-radius': 0 === buttonBorderRadius,
	} );

	const buttonStyle = {
		background: customButtonGradient || undefined,
		backgroundColor:
			buttonBackgroundClass || customButtonGradient || buttonGradient
				? undefined
				: customButtonBackgroundColor,
		color: buttonTextClass ? undefined : customButtonTextColor,
		borderRadius: buttonBorderRadius ? buttonBorderRadius + 'px' : undefined,
	};

	return (
		<div className={ blockClasses }>
			<RichText.Content
				className={ buttonClasses }
				data-id-attr={ uniqueId || 'placeholder' }
				href={ buttonUrl }
				id={ uniqueId }
				rel="noopener noreferrer"
				role="button"
				style={ buttonStyle }
				tagName="a"
				target="_blank"
				value={ buttonText }
			/>
		</div>
	);
};

export default ButtonSave;
