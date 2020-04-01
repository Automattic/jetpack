/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import save from './save';

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
			buttonOnNewLine: false,
			submitButtonText: attr.submitButtonText,
			emailFieldBackgroundColor: '',
			customEmailFieldBackgroundColor: '',
			emailFieldGradient: '',
			customEmailFieldGradient: '',
			buttonBackgroundColor: attr.backgroundButtonColor ? attr.backgroundButtonColor : 'accent',
			customButtonBackgroundColor: attr.customBackgroundButtonColor,
			buttonGradient: '',
			customButtonGradient: '',
			textColor: attr.textButtonColor ? attr.textButtonColor : 'background',
			customTextColor: attr.customTextButtonColor,
			fontSize: 18,
			customFontSize: 18,
			borderRadius: 6,
			borderWeight: 2,
			borderColor: '',
			customBorderColor: '',
			padding: 15,
			spacing: 10,
		};
	},
	save,
};
