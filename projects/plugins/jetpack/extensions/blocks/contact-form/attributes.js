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
		default: __( 'Message Sent', 'jetpack' ),
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
	// salesforce integration: these don't make sense except on the variation.
	// needed to persist in order show editor options and backend submit process
	salesforceData: {
		type: 'object',
		default: {
			organizationId: '',
			sendToSalesforce: false,
		},
	},
};
