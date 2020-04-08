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
};
