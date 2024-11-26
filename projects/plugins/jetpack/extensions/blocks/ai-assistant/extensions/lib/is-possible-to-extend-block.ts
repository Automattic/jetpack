/*
 * External dependencies
 */
import { JETPACK_MODULES_STORE_ID } from '@automattic/jetpack-shared-extension-utils';
import { select } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { EXTENDED_BLOCKS } from '../constants';
import { canAIAssistantBeEnabled } from './can-ai-assistant-be-enabled';

const BLOCK_TO_MODULE_MAP = {
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

	const blockRequiredModule = BLOCK_TO_MODULE_MAP[ blockName ];
	if ( blockRequiredModule ) {
		// This call is the same as useModuleStatus( blockRequiredModule ).isModuleActive,
		// yet we can't use a hook outside a component.
		// See: js-packages/shared-extension-utils/src/hooks/use-module-status/index.js
		const blockModuleIsEnabled =
			select( JETPACK_MODULES_STORE_ID )?.isModuleActive?.( blockRequiredModule ) || false;

		if ( ! blockModuleIsEnabled ) {
			return false;
		}
	}

	return true;
}
