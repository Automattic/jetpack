/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ToolbarButton, Dropdown } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import React from 'react';
/**
 * Internal dependencies
 */
import { getStoreBlockId } from '../../extensions/ai-assistant/with-ai-assistant';
import { getBlocksContent, getRawTextFromHTML } from '../../lib/utils/block-content';
import { transformToAIAssistantBlock } from '../../transforms';
import AiAssistantToolbarDropdownContent from './dropdown-content';
import './style.scss';
/**
 * Types and constants
 */
import type { AiAssistantDropdownOnChangeOptionsArgProps } from './dropdown-content';
import type { ExtendedBlockProp } from '../../extensions/ai-assistant';
import type { PromptTypeProp } from '../../lib/prompt';
import type { ReactElement } from 'react';

const debug = debugFactory( 'jetpack-ai-assistant:dropdown' );

type AiAssistantBlockToolbarDropdownContentProps = {
	onClose: () => void;
	blockType: ExtendedBlockProp;
};

/**
 * The dropdown component with logic for the AI Assistant block.
 * @param {AiAssistantBlockToolbarDropdownContentProps} props - The props.
 * @return {ReactElement} The React content of the dropdown.
 */
function AiAssistantBlockToolbarDropdownContent( {
	onClose,
	blockType,
}: AiAssistantBlockToolbarDropdownContentProps ) {
	// Set the state for the no content info.
	const [ noContent, setNoContent ] = useState( false );

	/*
	 * Let's disable the eslint rule for this line.
	 * @todo: fix by using StoreDescriptor, or something similar
	 */
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const { getSelectedBlockClientIds, getBlocksByClientId } = useSelect( 'core/block-editor' );
	const { removeBlocks, replaceBlock } = useDispatch( 'core/block-editor' );

	// Store the current content in a local state
	useEffect( () => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		const rawContent = getRawTextFromHTML( content );

		// Set no content condition to show the Notice info message.
		return setNoContent( ! rawContent.length );
	}, [ getBlocksByClientId, getSelectedBlockClientIds ] );

	const { tracks } = useAnalytics();

	const requestSuggestion = (
		promptType: PromptTypeProp,
		options: AiAssistantDropdownOnChangeOptionsArgProps = {}
	) => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		onClose();
		debug( 'requestSuggestion', promptType, options );
		tracks.recordEvent( 'jetpack_editor_ai_assistant_extension_toolbar_button_click', {
			suggestion: promptType,
			block_type: blockType,
		} );

		const [ firstBlock ] = blocks;
		const [ firstClientId, ...otherBlocksIds ] = clientIds;

		const extendedBlockAttributes = {
			...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
			content,
		};

		const newAIAssistantBlock = transformToAIAssistantBlock( blockType, extendedBlockAttributes );

		/*
		 * Store in the local storage the client id
		 * of the block that need to auto-trigger the AI Assistant request.
		 * @todo: find a better way to update the content,
		 * probably using a new store triggering an action.
		 */

		// Storage client Id, prompt type, and options.
		const storeObject = {
			clientId: firstClientId,
			type: promptType,
			options: { ...options, contentType: 'generated', fromExtension: true }, // When converted, the original content must be treated as generated
		};

		localStorage.setItem(
			getStoreBlockId( newAIAssistantBlock.clientId ),
			JSON.stringify( storeObject )
		);

		/*
		 * Replace the first block with the new AI Assistant block instance.
		 * This block contains the original content,
		 * even for multiple blocks selection.
		 */
		replaceBlock( firstClientId, newAIAssistantBlock );

		// It removes the rest of the blocks in case there are more than one.
		removeBlocks( otherBlocksIds );
	};

	const replaceWithAiAssistantBlock = () => {
		const clientIds = getSelectedBlockClientIds();
		const blocks = getBlocksByClientId( clientIds );
		const content = getBlocksContent( blocks );

		const [ firstClientId, ...otherBlocksIds ] = clientIds;
		const [ firstBlock ] = blocks;

		const extendedBlockAttributes = {
			...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
			content,
		};

		replaceBlock(
			firstClientId,
			transformToAIAssistantBlock( blockType, extendedBlockAttributes )
		);

		removeBlocks( otherBlocksIds );
		tracks.recordEvent( 'jetpack_ai_assistant_prompt_show', { block_type: blockType } );
	};

	return (
		<AiAssistantToolbarDropdownContent
			blockType={ blockType }
			onRequestSuggestion={ requestSuggestion }
			onAskAiAssistant={ replaceWithAiAssistantBlock }
			disabled={ noContent }
		/>
	);
}

type AiAssistantBlockToolbarDropdownProps = {
	blockType: ExtendedBlockProp;
	label?: string;
};

/**
 * The AI Assistant dropdown component.
 * @param {AiAssistantBlockToolbarDropdownProps} props - The props.
 * @return {ReactElement} The AI Assistant dropdown component.
 */
export default function AiAssistantBlockToolbarDropdown( {
	blockType,
	label = __( 'AI Assistant', 'jetpack' ),
}: AiAssistantBlockToolbarDropdownProps ) {
	const { tracks } = useAnalytics();

	const toggleHandler = isOpen => {
		if ( isOpen ) {
			tracks.recordEvent( 'jetpack_ai_assistant_extension_toolbar_menu_show', {
				block_type: blockType,
			} );
		}
	};

	return (
		<Dropdown
			popoverProps={ {
				variant: 'toolbar',
			} }
			renderToggle={ ( { isOpen, onToggle } ) => {
				return (
					<ToolbarButton
						className="jetpack-ai-assistant__button"
						showTooltip
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						label={ label }
						icon={ aiAssistantIcon }
					/>
				);
			} }
			onToggle={ toggleHandler }
			renderContent={ ( { onClose: onClose } ) => (
				<AiAssistantBlockToolbarDropdownContent onClose={ onClose } blockType={ blockType } />
			) }
		/>
	);
}
