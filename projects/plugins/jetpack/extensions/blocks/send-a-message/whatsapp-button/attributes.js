import { __ } from '@wordpress/i18n';

export default {
	countryCode: {
		type: 'string',
	},
	phoneNumber: {
		type: 'string',
	},
	firstMessage: {
		type: 'string',
		default: __( 'Hi, I got your WhatsApp information from your website.', 'jetpack' ),
	},
	buttonText: {
		type: 'array',
		source: 'children',
		selector: 'a.whatsapp-block__button',
		default: __( 'Chat on WhatsApp', 'jetpack' ),
	},
	backgroundColor: {
		type: 'string',
		default: '#25D366',
	},
	colorClass: {
		type: 'string',
		default: 'dark',
	},
	openInNewTab: {
		type: 'boolean',
		default: false,
	},
};
