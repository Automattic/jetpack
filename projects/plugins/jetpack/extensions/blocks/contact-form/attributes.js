/**
 * External dependencies
 */
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
};
