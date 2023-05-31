/*
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { isUserConnected } from '../../lib/connection';
import withMultipleBlocksEdition from './edit';

const EXTENDED_BLOCKS = [ 'core/paragraph', 'core/heading' ];

function multipleBlocksEdition( settings, name ) {
	const connected = isUserConnected();

	if ( ! connected ) {
		return settings;
	}

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
