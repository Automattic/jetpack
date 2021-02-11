/**
 * Internal dependencies
 */
import { BASE_CLASS_NAME } from './utils';

export default {
	label: {
		type: 'string',
	},
	slug: {
		type: 'string',
	},
	timestamp: {
		type: 'string',
		default: '00:00',
	},
	showTimestamp: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: `.${ BASE_CLASS_NAME }__content-wrapper`,
		multiline: 'p',
		default: '',
	},
};
