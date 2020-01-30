/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

const urlValidator = url => ! url || url.startsWith( 'http' );

export default {
	url: {
		type: 'string',
		validator: urlValidator,
	},
	eventId: {
		type: 'number',
	},
	style: {
		type: 'string',
	},
	// Modal button attributes, used for Button & Modal embed type.
	text: {
		type: 'string',
		default: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
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
};
