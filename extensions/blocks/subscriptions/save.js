/**
 * External dependencies
 */
import { select } from '@wordpress/data';
import { RawHTML } from '@wordpress/element';
import {
	getColorClassName,
	getColorObjectByAttributeValues,
	__experimentalGetGradientClass as getGradientClass,
	getFontSizeClass,
} from '@wordpress/block-editor';
import classnames from 'classnames';

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
	} = attributes;

	const editorSettings = select( 'core/editor' ).getEditorSettings();

	const textColorClass = getColorClassName( 'color', textColor );
	const fontSizeClass = getFontSizeClass( fontSize );
	const borderClass = getColorClassName( 'border-color', borderColor );

	const buttonBackgroundClass = getColorClassName( 'background-color', buttonBackgroundColor );
	const buttonGradientClass = getGradientClass( buttonGradient );

	const emailFieldBackgroundClass = getColorClassName(
		'background-color',
		emailFieldBackgroundColor
	);
	const emailFieldGradientClass = getGradientClass( emailFieldGradient );

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

	const fontSizeStyle = fontSizeClass ? undefined : customFontSize;

	// Themes don't regularly support border color classes, so pass the hex to styles either way.
	const customBorderColorStyle = getColorObjectByAttributeValues(
		editorSettings.colors,
		borderColor,
		customBorderColor
	).color;

	const getBlockClassName = () => {
		return classnames(
			className,
			buttonOnNewLine ? undefined : 'wp-block-jetpack-subscriptions__same-line',
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__showsubs' : undefined
		);
	};

	return (
		<div className={ getBlockClassName() }>
			<RawHTML>
				{ `
			[jetpack_subscription_form
				subscribe_placeholder="${ subscribePlaceholder }"
				show_subscribers_total="${ showSubscribersTotal }"
				button_on_sameline="${ buttonOnNewLine }"
				submit_button_text="${ submitButtonText }"
				custom_background_emailfield_color="${ emailFieldBackgroundStyle }"
				custom_background_button_color="${ buttonBackgroundStyle }"
				custom_text_button_color="${ customTextColor }"
				custom_font_size="${ fontSizeStyle }"
				custom_border_radius="${ borderRadius }"
				custom_border_weight="${ borderWeight }"
				custom_border_color="${ customBorderColorStyle }"
				custom_padding="${ padding }"
				custom_spacing="${ spacing }"
				submit_button_classes="${ submitButtonClasses }"
				email_field_classes="${ emailFieldClasses }"
				show_only_email_and_button="true"
			]` }
			</RawHTML>
		</div>
	);
}
