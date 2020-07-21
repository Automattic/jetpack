/**
 * External dependencies
 */
import { RawHTML } from '@wordpress/element';
import {
	getColorClassName,
	__experimentalGetGradientClass as getGradientClass,
	getFontSizeClass,
} from '@wordpress/block-editor';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import definedAttributes from './attributes';
import {
	DEFAULT_BORDER_RADIUS_VALUE,
	DEFAULT_BORDER_WEIGHT_VALUE,
	DEFAULT_PADDING_VALUE,
	DEFAULT_SPACING_VALUE,
	DEFAULT_FONTSIZE_VALUE,
} from '../../constants';

export default function getSubscriptionsShortcode(
	className,
	attributes,
	checkTextDefaults = null
) {
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

	const sharedClasses = classnames(
		borderRadius === 0 ? 'no-border-radius' : undefined,
		fontSizeClass,
		borderClass
	);

	const submitButtonClasses = classnames(
		sharedClasses,
		textColor ? 'has-text-color' : undefined,
		textColorClass,
		buttonBackgroundColor || buttonGradient ? 'has-background' : undefined,
		buttonBackgroundClass,
		buttonGradientClass
	);

	const emailFieldClasses = classnames(
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

	const getBlockClassName = () => {
		return classnames(
			className,
			'wp-block-jetpack-subscriptions__supports-newline',
			buttonOnNewLine ? 'wp-block-jetpack-subscriptions__use-newline' : undefined,
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__show-subs' : undefined
		);
	};

	let placeholderText = subscribePlaceholder;
	let buttonText = submitButtonText;

	if ( 'check-text-defaults' === checkTextDefaults ) {
		placeholderText =
			subscribePlaceholder === definedAttributes.subscribePlaceholder.default
				? 'Enter your email address'
				: subscribePlaceholder;
		buttonText =
			submitButtonText === definedAttributes.submitButtonText.default
				? 'Sign Up'
				: submitButtonText;
	}

	return (
		<div className={ getBlockClassName() }>
			<RawHTML>
				{ `
			[jetpack_subscription_form
				subscribe_placeholder="${ placeholderText }"
				show_subscribers_total="${ showSubscribersTotal }"
				button_on_newline="${ buttonOnNewLine }"
				submit_button_text="${ buttonText }"
				custom_background_emailfield_color="${ emailFieldBackgroundStyle }"
				custom_background_button_color="${ buttonBackgroundStyle }"
				custom_text_button_color="${ customTextColor }"
				custom_font_size="${ customFontSize || DEFAULT_FONTSIZE_VALUE }"
				custom_border_radius="${ borderRadius || DEFAULT_BORDER_RADIUS_VALUE }"
				custom_border_weight="${ borderWeight || DEFAULT_BORDER_WEIGHT_VALUE }"
				custom_border_color="${ customBorderColor }"
				custom_padding="${ padding || DEFAULT_PADDING_VALUE }"
				custom_spacing="${ spacing || DEFAULT_SPACING_VALUE }"
				submit_button_classes="${ submitButtonClasses }"
				email_field_classes="${ emailFieldClasses }"
				show_only_email_and_button="true"
			]` }
			</RawHTML>
		</div>
	);
}
