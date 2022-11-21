import { __ } from '@wordpress/i18n';

export default {
	subject: {
		type: 'string',
	},
	to: {
		type: 'string',
	},
	customThankyou: {
		type: 'string',
		default: '',
	},
	customThankyouHeading: {
		type: 'string',
		default: __( 'Your message has been sent', 'jetpack' ),
	},
	customThankyouMessage: {
		type: 'string',
		default: '',
	},
	customThankyouRedirect: {
		type: 'string',
		default: '',
	},
	jetpackCRM: {
		type: 'boolean',
		default: true,
	},
	formTitle: {
		type: 'string',
		default: '',
	},
};
