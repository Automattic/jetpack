/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { isUrl } from '@wordpress/url';

/**
 * Internal dependencies
 */
import colorValidator from '../../shared/colorValidator';

export default {
	url: {
		type: 'string',
		validator: isUrl,
	},
	itemsToShow: {
		type: 'integer',
		default: 5,
	},
	showCoverArt: {
		type: 'boolean',
		default: true,
	},
	showEpisodeDescription: {
		type: 'boolean',
		default: true,
	},
	primaryColor: {
		type: 'string',
	},
	customPrimaryColor: {
		type: 'string',
		validator: colorValidator,
	},
	secondaryColor: {
		type: 'string',
	},
	customSecondaryColor: {
		type: 'string',
		validator: colorValidator,
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
		validator: colorValidator,
	},
};
