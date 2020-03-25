/**
 * External dependencies
 */
import { RawHTML } from '@wordpress/element';

export default function Save( { attributes } ) {
	const {
		showSubscribersTotal,
		submitButtonClasses,
		submitButtonCustomBackgroundColor,
		submitButtonCustomTextColor,
		submitButtonText,
	} = attributes;
	return (
		<RawHTML>{ `[jetpack_subscription_form show_only_email_and_button="true" custom_background_button_color="${ submitButtonCustomBackgroundColor }" custom_text_button_color="${ submitButtonCustomTextColor }" submit_button_text="${ submitButtonText }" submit_button_classes="${ submitButtonClasses }" show_subscribers_total="${ showSubscribersTotal }" ]` }</RawHTML>
	);
}
