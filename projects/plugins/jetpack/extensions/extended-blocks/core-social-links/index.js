/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { createBlock } from '@wordpress/blocks';

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
