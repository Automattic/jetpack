/*
 * External dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import metadata from '../../block.json';
import { isUserConnected } from '../../lib/connection';
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';

// We have two types of block extensions for now, transformative and inline.
// The transformative blocks are transformed into an AI Assistant block when a request is made.
// The inline blocks are updated in place.
// Once all transformative blocks are converted to inline blocks, we can remove the distinction, but for now, we need to keep it.

export const AI_ASSISTANT_SUPPORT_NAME = 'ai-assistant-support';
export const AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME = 'ai-assistant-extensions-support';

// Check if the AI Assistant support is enabled.
export const isAiAssistantSupportEnabled = getFeatureAvailability( AI_ASSISTANT_SUPPORT_NAME );
// Check if the AI Assistant inline extensions support is enabled.
export const isAiAssistantExtensionsSupportEnabled = getFeatureAvailability(
	AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME
);

// The blocks will be converted one by one to inline blocks, so we update the lists accordingly, under the feature flag.
export let EXTENDED_TRANSFORMATIVE_BLOCKS: string[];
export let EXTENDED_INLINE_BLOCKS: string[];

if ( isAiAssistantExtensionsSupportEnabled ) {
	EXTENDED_TRANSFORMATIVE_BLOCKS = [ 'core/paragraph', 'core/list' ];
	EXTENDED_INLINE_BLOCKS = [ 'core/heading' ];
} else {
	EXTENDED_TRANSFORMATIVE_BLOCKS = [ 'core/paragraph', 'core/list', 'core/heading' ];
	EXTENDED_INLINE_BLOCKS = [];
}

// Since the lists depend on the feature flag, we need to define the types manually.
export type ExtendedBlockProp = 'core/paragraph' | 'core/list' | 'core/heading';
export type ExtendedInlineBlockProp = 'core/heading';

type BlockSettingsProps = {
	supports: {
		'jetpack/ai': {
			assistant: boolean;
		};
	};
};

/**
 * Check if it is possible to extend the block.
 *
 * @returns {boolean} True if it is possible to extend the block.
 */
export function isPossibleToExtendBlock(): boolean {
	const isBlockRegistered = getBlockType( metadata.name );
	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check Jetpack extension is enabled.
	if ( ! isAiAssistantSupportEnabled ) {
		return false;
	}

	// Do not extend the block if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return false;
	}

	// Do not extend if there is an error getting the feature.
	const { errorCode } = select( 'wordpress-com/plans' )?.getAiAssistantFeature?.() || {};
	if ( errorCode ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined.
	if ( hiddenBlocks.includes( metadata.name ) ) {
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
	if ( ! EXTENDED_TRANSFORMATIVE_BLOCKS.includes( name ) ) {
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
