/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
	KEY_ASK_AI_ASSISTANT,
} from '../../components/ai-assistant-controls';
import useTextContentFromSelectedBlocks from '../../hooks/use-text-content-from-selected-blocks';
import { getRawTextFromHTML } from '../../lib/utils/block-content';
import { transformToAIAssistantBlock } from '../../transforms';
/*
 * Types
 */
import type { PromptTypeProp } from '../../lib/prompt';

export function getStoreBlockId( clientId ) {
	return `ai-assistant-block-${ clientId }`;
}

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { name: blockType } = props;
		const { removeBlocks, replaceBlock } = useDispatch( 'core/block-editor' );
		const { content, clientIds, blocks } = useTextContentFromSelectedBlocks();

		/*
		 * Set exclude dropdown options.
		 * - Exclude "Ask AI Assistant" for core/list-item block.
		 */
		const exclude = [];
		if ( blockType === 'core/list-item' ) {
			exclude.push( KEY_ASK_AI_ASSISTANT );
		}
		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				const [ firstBlock ] = blocks;
				const [ firstClientId, ...otherBlocksIds ] = clientIds;

				const extendedBlockAttributes = {
					...( firstBlock?.attributes || {} ), // firstBlock.attributes should never be undefined, but still add a fallback
					content,
				};

				const newAIAssistantBlock = transformToAIAssistantBlock(
					blockType,
					extendedBlockAttributes
				);

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
					options: { ...options, contentType: 'generated' }, // When converted, the original content must be treated as generated
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
			},
			[ blocks, clientIds, content, blockType, replaceBlock, removeBlocks ]
		);

		const replaceWithAiAssistantBlock = useCallback( () => {
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
		}, [ blocks, blockType, content, replaceBlock, clientIds, removeBlocks ] );

		const blockControlProps = {
			group: 'block',
		};
		const rawContent = getRawTextFromHTML( content );

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls { ...blockControlProps }>
					<AiAssistantDropdown
						disabled={ ! rawContent?.length }
						onChange={ requestSuggestion }
						onReplace={ replaceWithAiAssistantBlock }
						exclude={ exclude }
					/>
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
