/**
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';

const addCoreEmbedOverride = settings => {
	// Bail if the block doesn't have variations.
	if ( ! ( 'variations' in settings ) || 'object' !== typeof settings.variations ) {
		return;
	}

	// Bail if the `videopress/video` block doesn't exist.
	if ( ! getBlockType( 'videopress/video' ) ) {
		return;
	}

	settings.variations.some( variation => {
		if ( 'videopress' === variation.name ) {
			// Set the scope to an empty array to hide the block.
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

	return settings;
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-embed/handle-representation',
	extendCoreEmbedVideoPressBlock
);
