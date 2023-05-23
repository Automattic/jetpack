/*
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import withMultipleBlocksEdition from './edit';

const EXTENDED_BLOCKS = [ 'core/paragraph', 'core/heading' ];

function multipleBlocksEdition( settings, name ) {
	if ( ! EXTENDED_BLOCKS.includes( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: withMultipleBlocksEdition( settings.edit ),
	};
}

// Extend BlockType.
addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-multiple-blocks-edition',
	multipleBlocksEdition
);
