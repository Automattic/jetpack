/*
 * External dependencies
 */
import { isUserConnected } from '@automattic/jetpack-shared-extension-utils';
import { getBlockType } from '@wordpress/blocks';
import { select } from '@wordpress/data';
/*
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';

export const AI_ASSISTANT_SUPPORT_NAME = 'ai-assistant-support';
export const AI_SIDEBAR_TOOLBAR_BUTTON = 'ai-sidebar-toolbar-button';

// Check if the AI Assistant support is enabled.
export const isAiAssistantSupportEnabled = getFeatureAvailability( AI_ASSISTANT_SUPPORT_NAME );
export const isAiSidebarToolbarButtonEnabled = getFeatureAvailability( AI_SIDEBAR_TOOLBAR_BUTTON );

/**
 * Check if it is possible to enable the AI Assistant block and its features.
 * @return {boolean} Whether it is possible to enable the AI Assistant.
 */
export function canAIAssistantBeEnabled(): boolean {
	// Check if the AI Assistant block is registered. If not, we understand that Jetpack AI is not active.
	const isBlockRegistered = getBlockType( 'jetpack/ai-assistant' );

	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check if AI Assistant support is enabled
	if ( ! isAiAssistantSupportEnabled ) {
		return false;
	}

	// Do not enable AI Assistant if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return false;
	}

	/*
	 * Do not enable if the AI Assistant block is hidden.
	 * Note: `select( 'core/edit-post' )` returns null on P2 sites (no post editor),
	 * so we fall back to an empty array, which allows the AI Assistant to be enabled.
	 */
	const hiddenBlocks =
		(
			select( 'core/edit-post' ) as null | { getHiddenBlockTypes?: () => string[] }
		 )?.getHiddenBlockTypes?.() ?? [];

	if ( hiddenBlocks.includes( 'jetpack/ai-assistant' ) ) {
		return false;
	}

	return true;
}
