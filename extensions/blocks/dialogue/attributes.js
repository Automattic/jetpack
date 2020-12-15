/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default {
	participant: {
		type: 'string',
		default: __( 'Participant', 'jetpack' ),
	},
	participantSlug: {
		type: 'string',
	},
	timeStamp: {
		type: 'string',
		default: '00:00',
	},
	showTimeStamp: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	content: {
		type: 'string',
	},
	hasBoldStyle: {
		type: 'boolean',
		default: true,
	},
	hasItalicStyle: {
		type: 'boolean',
	},
	hasUppercaseStyle: {
		type: 'boolean',
	},
};
