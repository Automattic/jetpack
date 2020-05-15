/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export const defaultAttributes = {
	subject: {
		type: 'string',
		default: __( 'A new message from your website', 'jetpack' ),
	},
	to: {
		type: 'string',
	},
	submitButtonText: {
		type: 'string',
		default: __( 'Submit', 'jetpack' ),
	},
	backgroundButtonColor: {
		type: 'string',
	},
	textButtonColor: {
		type: 'string',
	},
	customBackgroundButtonColor: {
		type: 'string',
		validator: colorValidator,
	},
	customTextButtonColor: {
		type: 'string',
		validator: colorValidator,
	},
	submitButtonClasses: {
		type: 'string',
	},
	hasFormSettingsSet: {
		type: 'string',
		default: null,
	},
	customThankyou: {
		type: 'string',
		default: '',
	},
	customThankyouMessage: {
		type: 'string',
		default: '',
	},
	customThankyouRedirect: {
		type: 'string',
		default: '',
	},
	padding: {
		type: 'number',
		default: 12,
	},
	spacing: {
		type: 'number',
		default: 10,
	},

	// Deprecated
	has_form_settings_set: {
		type: 'string',
		default: null,
	},
	submit_button_text: {
		type: 'string',
		default: __( 'Submit', 'jetpack' ),
	},
};
