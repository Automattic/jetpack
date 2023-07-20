/*
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { blockName } from '../..';
import { AI_Assistant_Initial_State } from '../../hooks/use-ai-feature';
import { isUserConnected } from '../../lib/connection';

/*
 * Types and Constants
 */
export const AI_ASSISTANT_SUPPORT_NAME = 'ai-assistant-support';

// List of blocks that can be extended.
export const EXTENDED_BLOCKS = [ 'core/paragraph', 'core/heading', 'core/list' ] as const;

export type ExtendedBlockProp = ( typeof EXTENDED_BLOCKS )[ number ];

type BlockSettingsProps = {
	supports: {
		'jetpack/ai': {
			assistant: boolean;
		};
	};
};

export const isAiAssistantSupportExtensionEnabled =
	window?.Jetpack_Editor_Initial_State.available_blocks?.[ AI_ASSISTANT_SUPPORT_NAME ];

/**
 * Check if it is possible to extend the block.
 *
 * @returns {boolean} True if it is possible to extend the block.
 */
export function isPossibleToExtendBlock(): boolean {
	const isBlockRegistered = getBlockType( blockName );
	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check Jetpack extension is enabled.
	if ( ! isAiAssistantSupportExtensionEnabled ) {
		return false;
	}

	// Do not extend the block if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return false;
	}

	// Do not extend if there is an error getting the feature.
	if ( AI_Assistant_Initial_State.errorCode ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined.
	if ( hiddenBlocks.includes( blockName ) ) {
		return false;
	}

	return true;
}

/**
 * Add jetpack/ai support to the extended blocks.
 *
 * @param {BlockSettingsProps} settings - Block settings.
 * @param {ExtendedBlockProp} name          - Block name.
 * @returns {BlockSettingsProps}          Block settings.
 */
function addJetpackAISupport(
	settings: BlockSettingsProps,
	name: ExtendedBlockProp
): BlockSettingsProps {
	// Only extend the blocks in the list.
	if ( ! EXTENDED_BLOCKS.includes( name ) ) {
		return settings;
	}

	if ( ! isPossibleToExtendBlock() ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			...settings.supports,
			'jetpack/ai': {
				assistant: true,
			},
		},
	};
}

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/ai-assistant-support', addJetpackAISupport, 100 );
