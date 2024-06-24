import {
	getColorClassName,
	__experimentalGetGradientClass as getGradientClass, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	getFontSizeClass,
} from '@wordpress/block-editor';
import { RawHTML } from '@wordpress/element';
import clsx from 'clsx';
import { reduce } from 'lodash';
import defaultAttributes from './attributes';

const DEFAULT_BORDER_RADIUS_VALUE = 0;
const DEFAULT_BORDER_WEIGHT_VALUE = 1;
const DEFAULT_PADDING_VALUE = 15;
const DEFAULT_SPACING_VALUE = 10;
const DEFAULT_FONTSIZE_VALUE = '16px';

export default function Save( { className, attributes } ) {
	const {
		subscribePlaceholder,
		showSubscribersTotal,
		buttonOnNewLine,
		submitButtonText,
		emailFieldBackgroundColor,
		customEmailFieldBackgroundColor,
		emailFieldGradient,
		customEmailFieldGradient,
		buttonBackgroundColor,
		customButtonBackgroundColor,
		buttonGradient,
		customButtonGradient,
		textColor,
		customTextColor,
		fontSize,
		customFontSize,
		borderRadius,
		borderWeight,
		borderColor,
		customBorderColor,
		padding,
		spacing,
		buttonWidth,
	} = attributes;

	const isGradientAvailable = !! getGradientClass;

	const textColorClass = getColorClassName( 'color', textColor );
	const fontSizeClass = getFontSizeClass( fontSize );
	const borderClass = getColorClassName( 'border-color', borderColor );
	const buttonBackgroundClass = getColorClassName( 'background-color', buttonBackgroundColor );
	const buttonGradientClass = isGradientAvailable ? getGradientClass( buttonGradient ) : undefined;

	const emailFieldBackgroundClass = getColorClassName(
		'background-color',
		emailFieldBackgroundColor
	);
	const emailFieldGradientClass = isGradientAvailable
		? getGradientClass( emailFieldGradient )
		: undefined;

	const sharedClasses = clsx(
		borderRadius === 0 ? 'no-border-radius' : undefined,
		fontSizeClass,
		borderClass
	);

	const submitButtonClasses = clsx(
		sharedClasses,
		textColor ? 'has-text-color' : undefined,
		textColorClass,
		buttonBackgroundColor || buttonGradient ? 'has-background' : undefined,
		buttonBackgroundClass,
		buttonGradientClass
	);

	const emailFieldClasses = clsx(
		sharedClasses,
		emailFieldBackgroundClass,
		emailFieldGradientClass
	);

	const emailFieldBackgroundStyle =
		! emailFieldBackgroundClass && customEmailFieldGradient
			? customEmailFieldGradient
			: customEmailFieldBackgroundColor;

	const buttonBackgroundStyle =
		! buttonBackgroundClass && customButtonGradient
			? customButtonGradient
			: customButtonBackgroundColor;

	const buttonWidthStyle = buttonWidth ? buttonWidth : undefined;

	const getBlockClassName = () => {
		return clsx(
			className,
			'wp-block-jetpack-subscriptions__supports-newline',
			buttonOnNewLine ? 'wp-block-jetpack-subscriptions__use-newline' : undefined,
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__show-subs' : undefined
		);
	};

	const shortcodeAttributes = {
		subscribe_placeholder:
			subscribePlaceholder !== defaultAttributes.subscribePlaceholder.default
				? subscribePlaceholder
				: undefined,
		show_subscribers_total: showSubscribersTotal,
		button_on_newline: buttonOnNewLine,
		submit_button_text:
			submitButtonText !== defaultAttributes.submitButtonText.default
				? submitButtonText
				: undefined,
		custom_background_emailfield_color: emailFieldBackgroundStyle,
		custom_background_button_color: buttonBackgroundStyle,
		custom_text_button_color: customTextColor,
		custom_font_size: customFontSize || DEFAULT_FONTSIZE_VALUE,
		custom_border_radius: borderRadius || DEFAULT_BORDER_RADIUS_VALUE,
		custom_border_weight: borderWeight || DEFAULT_BORDER_WEIGHT_VALUE,
		custom_border_color: customBorderColor,
		custom_button_width: buttonWidthStyle,
		custom_padding: padding || DEFAULT_PADDING_VALUE,
		custom_spacing: spacing || DEFAULT_SPACING_VALUE,
		submit_button_classes: submitButtonClasses,
		email_field_classes: emailFieldClasses,
		show_only_email_and_button: true,
	};

	const shortcodeAttributesStringified = reduce(
		shortcodeAttributes,
		( stringifiedAttributes, value, key ) => {
			if ( undefined === value ) {
				return stringifiedAttributes;
			}
			return stringifiedAttributes + ` ${ key }="${ value }"`;
		},
		''
	);

	return (
		<div className={ getBlockClassName() }>
			<RawHTML>{ `[jetpack_subscription_form${ shortcodeAttributesStringified }]` }</RawHTML>
		</div>
	);
}
