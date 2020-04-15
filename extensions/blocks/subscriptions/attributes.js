/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	subscribePlaceholder: {
		type: 'string',
		default: __( 'Enter your email here', 'jetpack' ),
	},
	showSubscribersTotal: {
		type: 'boolean',
		default: false,
	},
	buttonOnNewLine: {
		type: 'boolean',
		default: false,
	},
	submitButtonText: {
		type: 'string',
		default: __( 'Sign Up', 'jetpack' ),
	},
	emailFieldBackgroundColor: {
		type: 'string',
	},
	customEmailFieldBackgroundColor: {
		type: 'string',
	},
	emailFieldGradient: {
		type: 'string',
	},
	customEmailFieldGradient: {
		type: 'string',
	},
	buttonBackgroundColor: {
		type: 'string',
		default: 'primary',
	},
	customButtonBackgroundColor: {
		type: 'string',
	},
	buttonGradient: {
		type: 'string',
	},
	customButtonGradient: {
		type: 'string',
	},
	textColor: {
		type: 'string',
		default: 'background',
	},
	customTextColor: {
		type: 'string',
	},
	fontSize: {
		type: 'number',
	},
	customFontSize: {
		type: 'number',
		default: 18,
	},
	borderRadius: {
		type: 'number',
		default: 0,
	},
	borderWeight: {
		type: 'number',
		default: 1,
	},
	borderColor: {
		type: 'string',
	},
	customBorderColor: {
		type: 'string',
	},
	padding: {
		type: 'number',
		default: 15,
	},
	spacing: {
		type: 'number',
		default: 10,
	},
};
