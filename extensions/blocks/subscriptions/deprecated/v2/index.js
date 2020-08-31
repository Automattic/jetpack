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
