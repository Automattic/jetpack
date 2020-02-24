/**
 * External Dependencies
 */
import { __ } from '@wordpress/i18n';

const hexRegex = /^#?[A-Fa-f0-9]{6}$/;

const colourValidator = value => hexRegex.test( value );

const urlValidator = url => ! url || url.startsWith( 'https://calendly.com/' );

export default {
	backgroundColor: {
		type: 'string',
		default: 'ffffff',
		validator: colourValidator,
	},
	submitButtonText: {
		type: 'string',
		default: __( 'Schedule time with me', 'jetpack' ),
	},
	submitButtonTextColor: {
		type: 'string',
	},
	submitButtonBackgroundColor: {
		type: 'string',
	},
	submitButtonClasses: { type: 'string' },
	hideEventTypeDetails: {
		type: 'boolean',
		default: false,
	},
	primaryColor: {
		type: 'string',
		default: '00A2FF',
		validator: colourValidator,
	},
	textColor: {
		type: 'string',
		default: '4D5055',
		validator: colourValidator,
	},
	style: {
		type: 'string',
		default: 'inline',
		validValues: [ 'inline', 'link' ],
	},
	url: {
		type: 'string',
		validator: urlValidator,
	},
	backgroundButtonColor: {
		type: 'string',
	},
	textButtonColor: {
		type: 'string',
	},
	customBackgroundButtonColor: {
		type: 'string',
		validator: colourValidator,
	},
	customTextButtonColor: {
		type: 'string',
		validator: colourValidator,
	},
};
