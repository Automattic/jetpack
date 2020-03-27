/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { isUrl } from '@wordpress/url';

/**
 * Check if the given string is a color
 * defined in HEX notation.
 *
 * @param {string} color Color to check.
 * @return {boolean} True if the color is in HEX notation. Otherwise, False.
 */
const isHEXColor = color => !! color.match( /^(#)((?:[A-Fa-f0-9]{3}){1,2})$/ );

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
		validator: isHEXColor,
	},
	secondaryColor: {
		type: 'string',
	},
	customSecondaryColor: {
		type: 'string',
		validator: isHEXColor,
	},
	backgroundColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
		validator: isHEXColor,
	},
};
