/*
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { AI_Assistant_Initial_State } from '../../hooks/use-ai-feature';
import { isUserConnected } from '../../lib/connection';
import withMultipleBlocksEdition from './edit';

const EXTENDED_BLOCKS = [ 'core/paragraph', 'core/heading' ];

function multipleBlocksEdition( settings, name ) {
	// Do not extend the block if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return settings;
	}

	// Do not extend the block if the site requires an upgrade.
	if ( AI_Assistant_Initial_State.requireUpgrade ) {
		return settings;
	}

	// Do not extend if there is an error getting the feature.
	if ( AI_Assistant_Initial_State.errorCode ) {
		return settings;
	}

	// Only extend the blocks in the list.
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
