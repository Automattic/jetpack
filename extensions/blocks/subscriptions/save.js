/**
 * External dependencies
 */
import { RawHTML } from '@wordpress/element';
import classnames from 'classnames';

export default function Save( { attributes } ) {
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
		borderRadius,
		borderWeight,
		borderColor,
		padding,
		spacing,
	} = attributes;

	const emailFieldBackgroundStyle =
		! customEmailFieldBackgroundColor && customEmailFieldGradient
			? customEmailFieldGradient
			: customEmailFieldBackgroundColor;

	const buttonBackgroundStyle =
		! customButtonBackgroundColor && customButtonGradient
			? customButtonGradient
			: customButtonBackgroundColor;

	// TODO: Check each background color for classname of not undefined, and add to classlist
	const submitButtonClasses = classnames(
		emailFieldBackgroundColor,
		emailFieldGradient,
		buttonBackgroundColor,
		buttonGradient,
		textColor
	);

	return (
		<RawHTML>
			{ `
			[jetpack_subscription_form
				subscribe_placeholder="${ subscribePlaceholder }"
				show_subscribers_total="${ showSubscribersTotal }"
				button_on_newline="${ buttonOnNewLine }"
				submit_button_text="${ submitButtonText }"
				custom_background_emailfield_color="${ emailFieldBackgroundStyle }"
				custom_background_button_color="${ buttonBackgroundStyle }"
				custom_text_button_color="${ customTextColor }"
				custom_font_size="${ fontSize }"
				custom_border_radius="${ borderRadius }"
				custom_border_weight="${ borderWeight }"
				custom_border_color="${ borderColor }"
				custom_padding="${ padding }"
				custom_spacing="${ spacing }"
				submit_button_classes="${ submitButtonClasses }"
				show_only_email_and_button="true"
			]` }
		</RawHTML>
	);
}
