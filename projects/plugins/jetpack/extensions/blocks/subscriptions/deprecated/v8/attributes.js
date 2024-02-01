import { __ } from '@wordpress/i18n';

export default {
	subscribePlaceholder: {
		type: 'string',
		default: __( 'Type your email…', 'jetpack' ),
	},
	showSubscribersTotal: {
		type: 'boolean',
		default: false,
	},
	buttonOnNewLine: {
		type: 'boolean',
		default: false,
	},
	buttonWidth: {
		type: 'string',
	},
	submitButtonText: {
		type: 'string',
		default: __( 'Subscribe', 'jetpack' ),
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
	},
	customTextColor: {
		type: 'string',
	},
	fontSize: {
		type: 'string',
	},
	customFontSize: {
		type: 'string',
	},
	borderRadius: {
		type: 'number',
	},
	borderWeight: {
		type: 'number',
	},
	borderColor: {
		type: 'string',
	},
	customBorderColor: {
		type: 'string',
	},
	padding: {
		type: 'number',
	},
	spacing: {
		type: 'number',
	},
	successMessage: {
		type: 'string',
		default: __(
			"Success! An email was just sent to confirm your subscription. Please find the email now and click 'Confirm Follow' to start subscribing.",
			'jetpack'
		),
	},
};
