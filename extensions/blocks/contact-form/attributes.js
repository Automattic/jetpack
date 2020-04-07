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
		default: '',
	},
	to: {
		type: 'string',
		default: '',
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
	submitButtonClasses: { type: 'string' },
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
