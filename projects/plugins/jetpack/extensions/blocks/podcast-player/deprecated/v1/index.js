import { isUrl } from '@wordpress/url';
import colorValidator from '../../../../shared/colorValidator';

// Deprecated V1 of podcast-player.
// The only difference between V1 and current is the save() function.
// V1's save does nothing: () => null.
// Current's save renders a simple link to the RSS feed.

const attributes = {
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
	hexPrimaryColor: {
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
	hexSecondaryColor: {
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
	hexBackgroundColor: {
		type: 'string',
		validator: colorValidator,
	},
	exampleFeedData: {
		type: 'object',
	},
};

const supports = {
	/*
	 * Support for block's alignment (left, center, right, wide, full). When
	 * true, it adds block controls to change block’s alignment.
	 */
	align: false, // [ 'left', 'right', 'full' ]
	/*
	 * Support for wide alignment, that requires additional support in themes.
	 */
	alignWide: true,
	/*
	 * When true, a new field in the block sidebar allows to define an id for
	 * the block and a button to copy the direct link.
	 */
	anchor: false,
	/*
	 * When true, a new field in the block sidebar allows to define a custom
	 * className for the block’s wrapper.
	 */
	customClassName: true,
	/*
	 * When false, Gutenberg won't add a class like .wp-block-your-block-name to
	 * the root element of your saved markup.
	 */
	className: true,
	/*
	 * Setting this to false suppress the ability to edit a block’s markup
	 * individually. We often set this to false in Jetpack blocks.
	 */
	html: false,
	/*
	 * When false, user will only be able to insert the block once per post.
	 */
	multiple: true,
	/*
	 * When false, the block won't be available to be converted into a reusable
	 * block.
	 */
	reusable: true,
};

export default {
	attributes,
	supports,
	save: () => null,
};
