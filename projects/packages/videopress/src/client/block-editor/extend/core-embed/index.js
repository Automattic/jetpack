/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import withCoreEmbedVideoPressBlock from './edit';

const addCoreEmbedOverride = settings => {
	if ( ! ( 'variations' in settings ) || 'object' !== typeof settings.variations ) {
		return;
	}

	settings.variations.some( variation => {
		if ( 'videopress' === variation.name ) {
			variation.scope = [];
			return true;
		}
		return false;
	} );
};

const extendCoreEmbedVideoPressBlock = ( settings, name ) => {
	if ( name !== 'core/embed' ) {
		return settings;
	}

	// Hide the core/embed block, `videopress` variation.
	addCoreEmbedOverride( settings );

	return {
		...settings,
		attributes: {
			...settings.attributes,
			keepUsingOEmbedVariation: {
				type: 'boolean',
			},
		},
		edit: withCoreEmbedVideoPressBlock( settings.edit ),
	};
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-embed/handle-representation',
	extendCoreEmbedVideoPressBlock
);
