/*
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import useBlockModuleStatus from '../../hooks/use-block-module-status';
import { getFeatureAvailability } from '../../lib/utils/get-feature-availability';
import { canAIAssistantBeEnabled } from '../lib/can-ai-assistant-be-enabled';
import AiAssistantImageExtensionToolbarDropdown from './components/image-toolbar-dropdown';

export const AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME = 'ai-assistant-image-extension';

// Check if the AI Assistant support is enabled.
export const isAiAssistantImageExtensionEnabled = getFeatureAvailability(
	AI_ASSISTANT_EXTENSIONS_SUPPORT_NAME
);

// Defines where the block controls should be placed in the toolbar
const blockControlsProps = {
	group: 'block' as const,
};

/**
 * Check if it is possible to extend an image block with AI Assistant capabilities.
 * @param {string} blockName - The block name.
 * @return {boolean}           Whether it is possible to extend the block.
 */
export function isPossibleToExtendImageBlock( blockName: string ): boolean {
	const canEnableAIAssistant = canAIAssistantBeEnabled();

	// Do not extend the block if AI Assistant cannot be enabled.
	if ( ! canEnableAIAssistant ) {
		return false;
	}

	// Do not extend the block if the AI Assistant image extension is not enabled.
	if ( ! isAiAssistantImageExtensionEnabled ) {
		return false;
	}

	// Only extend the image block
	if ( blockName !== 'core/image' ) {
		return false;
	}

	return true;
}

// HOC to populate the block's edit component with the AI Assistant toolbar button.
const blockEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	function ExtendedBlock( props ) {
		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls { ...blockControlsProps }>
					<AiAssistantImageExtensionToolbarDropdown
						onRequestAltText={ () => {} }
						onRequestCaption={ () => {} }
					/>
				</BlockControls>
			</>
		);
	}

	return props => {
		const isRequiredModulePresent = useBlockModuleStatus( props.name );

		// If the required module is not enabled, return the original block edit component early.
		if ( ! isRequiredModulePresent ) {
			return <BlockEdit { ...props } />;
		}

		return <ExtendedBlock { ...props } />;
	};
}, 'blockEditWithAiComponents' );

/**
 * Function used to extend the registerBlockType settings.
 * Populates the block edit component with the AI Assistant bar and button.
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object}          The extended block settings.
 */
function blockWithInlineExtension( settings, name: string ) {
	// Only extend the allowed block types and when AI is enabled
	const possibleToExtendBlock = isPossibleToExtendImageBlock( name );

	if ( ! possibleToExtendBlock ) {
		return settings;
	}

	return {
		...settings,
		edit: blockEditWithAiComponents( settings.edit ),
		supports: {
			...settings.supports,
			'jetpack/ai': {
				assistant: true,
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support/with-ai-image-extension',
	blockWithInlineExtension,
	100
);
