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

const isGradientAvailable = !! getGradientClass;

export default function ButtonSave( attributes, uniqueId ) {
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
	const buttonGradientClass = isGradientAvailable ? getGradientClass( buttonGradient ) : undefined;
	const buttonTextClass = getColorClassName( 'color', buttonTextColor );

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
		<div className={ classnames( 'wp-block-button', 'jetpack-submit-button', className ) }>
			<RichText.Content
				className={ buttonClasses }
				data-id-attr={ uniqueId }
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
}
