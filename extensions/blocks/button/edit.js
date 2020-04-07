/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	RichText,
	__experimentalUseGradient as useGradient,
	withColors,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import applyFallbackStyles from './apply-fallback-styles';
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';
import { IS_GRADIENT_AVAILABLE } from './constants';

const ButtonEdit = ( {
	attributes,
	buttonBackgroundColor,
	buttonFallbackBackgroundColor,
	buttonFallbackTextColor,
	buttonTextColor,
	className,
	setAttributes,
	setButtonBackgroundColor,
	setButtonTextColor,
} ) => {
	const { buttonBorderRadius, buttonPlaceholder, buttonText } = attributes;

	/* eslint-disable react-hooks/rules-of-hooks */
	const {
		gradientClass: buttonGradientClass,
		gradientValue: buttonGradientValue,
		setGradient: setButtonGradient,
	} = IS_GRADIENT_AVAILABLE
		? useGradient( {
				gradientAttribute: 'buttonGradient',
				customGradientAttribute: 'customButtonGradient',
		  } )
		: {};
	/* eslint-enable react-hooks/rules-of-hooks */

	const blockClasses = classnames( 'wp-block-button', className );

	const buttonClasses = classnames( 'wp-block-button__link', {
		'has-background': buttonBackgroundColor.color || buttonGradientValue,
		[ buttonBackgroundColor.class ]: ! buttonGradientValue && buttonBackgroundColor.class,
		'has-text-color': buttonTextColor.color,
		[ buttonTextColor.class ]: buttonTextColor.class,
		[ buttonGradientClass ]: buttonGradientClass,
		'no-border-radius': 0 === buttonBorderRadius,
	} );

	const buttonStyles = {
		...( ! buttonBackgroundColor.color && buttonGradientValue
			? { background: buttonGradientValue }
			: { backgroundColor: buttonBackgroundColor.color } ),
		color: buttonTextColor.color,
		borderRadius: buttonBorderRadius ? buttonBorderRadius + 'px' : undefined,
	};

	return (
		<div className={ blockClasses }>
			<RichText
				allowedFormats={ [] }
				className={ buttonClasses }
				onChange={ value => setAttributes( { buttonText: value } ) }
				placeholder={ buttonPlaceholder || __( 'Add text…', 'jetpack' ) }
				style={ buttonStyles }
				value={ buttonText }
				withoutInteractiveFormatting
			/>
			<InspectorControls>
				<ButtonColorsPanel
					{ ...{
						buttonBackgroundColor,
						buttonFallbackBackgroundColor,
						buttonFallbackTextColor,
						buttonGradientValue,
						buttonTextColor,
						setButtonBackgroundColor,
						setButtonGradient,
						setButtonTextColor,
					} }
				/>
				<ButtonBorderPanel
					buttonBorderRadius={ buttonBorderRadius }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
		</div>
	);
};

export default compose(
	withColors( { buttonBackgroundColor: 'background-color' }, { buttonTextColor: 'color' } ),
	applyFallbackStyles
)( ButtonEdit );
