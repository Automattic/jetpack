/*
 * External dependencies
 */
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
/*
 * Internal dependencies
 */
import { EXTENDED_BLOCKS } from '../constants';
import { canAIAssistantBeEnabled } from './can-ai-assistant-be-enabled';

// Maps the block name to the module name.
const blockToModuleMapper = {
	'jetpack/contact-form': 'contact-form',
};

/**
 * Check if it is possible to extend a block with AI Assistant capabilities.
 * @param {string} blockName - The block name.
 * @return {boolean}           Whether it is possible to extend the block.
 */
export function isPossibleToExtendBlock( blockName: string ): boolean {
	const canEnableAIAssistant = canAIAssistantBeEnabled();

	// Do not extend the block if AI Assistant cannot be enabled.
	if ( ! canEnableAIAssistant ) {
		return false;
	}

	// Only extend the blocks in the inline blocks list
	if ( ! EXTENDED_BLOCKS.includes( blockName ) ) {
		return false;
	}

	return true;
}

/**
 * Hook that checks if a block can be extended with AI Assistant capabilities.
 * @param {string} blockName - The block name.
 * @return {boolean} Whether the block can be extended.
 */
export function useIsPossibleToExtendBlock( blockName: string ): boolean {
	const moduleName = blockToModuleMapper[ blockName ];

	const { isModuleActive } = useModuleStatus( moduleName );
	const canExtend = isPossibleToExtendBlock( blockName );

	return ! moduleName || ( isModuleActive && canExtend );
}
