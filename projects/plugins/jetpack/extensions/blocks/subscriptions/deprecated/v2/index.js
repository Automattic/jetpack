import { __ } from '@wordpress/i18n';
import save from './save';

/**
 * Deprecation reason:
 *
 * Addition of option to display button on new line and renaming of color
 * attributes to better support use of SubmitButton component.
 */
export default {
	attributes: {
		subscribePlaceholder: { type: 'string', default: __( 'Email Address', 'jetpack' ) },
		subscribeButton: { type: 'string', default: __( 'Subscribe', 'jetpack' ) },
		showSubscribersTotal: { type: 'boolean', default: false },
		submitButtonText: {
			type: 'string',
			default: __( 'Subscribe', 'jetpack' ),
		},
		backgroundButtonColor: {
			type: 'string',
		},
		textButtonColor: {
			type: 'string',
		},
		customBackgroundButtonColor: { type: 'string' },
		customTextButtonColor: { type: 'string' },
		submitButtonClasses: { type: 'string' },
	},
	migrate: attr => {
		return {
			subscribePlaceholder: attr.subscribePlaceholder,
			showSubscribersTotal: attr.showSubscribersTotal,
			buttonOnNewLine: true,
			submitButtonText: attr.submitButtonText,
			buttonBackgroundColor: attr.backgroundButtonColor ? attr.backgroundButtonColor : 'primary',
			customButtonBackgroundColor: attr.customBackgroundButtonColor,
			textColor: attr.textButtonColor ? attr.textButtonColor : 'background',
			customTextColor: attr.customTextButtonColor,
		};
	},
	save,
};
