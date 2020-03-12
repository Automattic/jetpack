/**
 * External dependencies
 */
import { isUrl } from '@wordpress/url';

export default {
	url: {
		type: 'string',
		validator: isUrl,
	},
	itemsToShow: {
		type: 'integer',
		default: 5,
	},
};
