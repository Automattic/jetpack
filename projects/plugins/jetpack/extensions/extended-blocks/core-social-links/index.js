import { createBlock } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
import services from './services';

/**
 * The Social Icons widget and Social Links block determine the link source
 * differently. This loops through all current icons and compares the URL against
 * an array of available services in order to populate the new blocks.
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
			transform: ( { instance } ) => {
				let innerBlocks = [];
				const icons = instance.raw.icons;

				icons.forEach( icon => {
					const iconUrl = new URL( icon.url.includes( ':' ) ? icon.url : 'https://' + icon.url );
					const iconHostname = iconUrl.hostname ? iconUrl.hostname : iconUrl.protocol;
					const iconService = services.find( service => {
						return iconHostname.includes( service.url ) || service.url.includes( iconHostname );
					} );

					const innerBlock = createBlock( 'core/social-link', {
						service: iconService ? iconService.name : 'chain',
						url: icon.url,
					} );
					innerBlocks = [ ...innerBlocks, innerBlock ];
				} );
				return createBlock( 'core/social-links', {}, innerBlocks );
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
