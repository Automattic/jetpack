/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createBlock } from '@wordpress/blocks';

/**
 * The Social Icons widget and Social Links block determine the link source
 * differently. The widget instance includes no data that can be easily used
 * to transfer to the new block.
 *
 * This will return a blank 'core/social-links' block
 *
 * @param {object} instance - The widget instance returned from the API
 * @param {string} idBase - The widget name
 * @returns {object} The transforms settings
 */
const socialLinksTransform = {
	from: [
		{
			type: 'block',
			isMultiBlock: false,
			blocks: [ 'core/legacy-widget' ],
			isMatch: ( { idBase, instance } ) => {
				if ( ! instance?.raw ) {
					return false;
				}
				return idBase === 'jetpack_widget_social_icons';
			},
			transform: () => {
				return createBlock( 'core/social-links' );
			},
		},
	],
};

/**
 * With the upgrade to block editor in widgets, the Social Icons widget is redundant.
 *
 * Since this feature is built into the Gutenberg core and there is no relevant Jetpack
 * block to place this in, we need to hook into the core block and apply the transform to
 * handle this addition.
 *
 * @param {object} settings - Block settings object.
 * @param {string} name - The block name
 * @returns {object} The settings for the given block with the patched variations.
 */
function addTransformToSocialLinksWidget( settings, name ) {
	if ( name !== 'core/social-links' ) {
		return settings;
	}

	settings.transforms = socialLinksTransform;

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'addTransformToSocialLinksWidget',
	addTransformToSocialLinksWidget
);
