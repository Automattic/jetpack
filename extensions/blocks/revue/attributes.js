/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

export default {
	revueUsername: {
		type: 'string',
	},
	text: {
		type: 'string',
		default: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
	},
	firstNameField: {
		type: 'boolean',
		default: true,
	},
	lastNameField: {
		type: 'boolean',
		default: true,
	},
	backgroundColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	borderRadius: {
		type: 'number',
	},
	gradient: {
		type: 'string',
	},
	customGradient: {
		type: 'string',
	},
};
