/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
	KEY_ASK_AI_ASSISTANT,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI, { SuggestionError } from '../../hooks/use-suggestions-from-ai';
import useTextContentFromSelectedBlocks from '../../hooks/use-text-content-from-selected-blocks';
import { getRawTextFromHTML } from '../../lib/utils/block-content';
import { transformToAIAssistantBlock } from '../../transforms';
/*
 * Types
 */
import type { PromptItemProps, PromptTypeProp } from '../../lib/prompt';

type StoredPromptProps = {
	messages: Array< PromptItemProps >;
};

export function getStoreBlockId( clientId ) {
	return `ai-assistant-block-${ clientId }`;
}

/*
 * An identifier to use on the extension error notices,
 * so a existing notice with the same ID gets replaced
 * by a new one, avoiding the stacking of notices.
 */
const AI_ASSISTANT_NOTICE_ID = 'ai-assistant';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const [ storedPrompt, setStoredPrompt ] = useState< StoredPromptProps >( {
			messages: [],
		} );

		const { name: blockType } = props;

		const { updateBlockAttributes, removeBlocks, replaceBlock } =
			useDispatch( 'core/block-editor' );
		const { createNotice } = useDispatch( 'core/notices' );

		const { content, clientIds, blocks } = useTextContentFromSelectedBlocks();

		/*
		 * Set exclude dropdown options.
		 * - Exclude "Ask AI Assistant" for core/list-item block.
		 */
		const exclude = [];
		if ( blockType === 'core/list-item' ) {
			exclude.push( KEY_ASK_AI_ASSISTANT );
		}

		const showSuggestionError = useCallback(
			( suggestionError: SuggestionError ) => {
				createNotice( suggestionError.status, suggestionError.message, {
					isDismissible: true,
					id: AI_ASSISTANT_NOTICE_ID,
				} );
			},
			[ createNotice ]
		);

		/**
		 * Set the content of the block.
		 *
		 * @param {string} newContent - The new content of the block.
		 * @returns {void}
		 */
		const updateBlockContent = useCallback(
			( newContent: string ) => {
				/*
				 * Pick the first client ID from the array.
				 * This is the client ID of the block that
				 * will updates its content.
				 *
				 * The rest of the items (blocks) will be removed,
				 * in case there are more than one.
				 */
				const [ firstClientId, ...restClientIds ] = clientIds;

				// Update the content of the new AI Assistant block instance.
				updateBlockAttributes( firstClientId, { content: newContent } );

				// Remove the rest of the block in case there are more than one.
				if ( restClientIds.length ) {
					removeBlocks( restClientIds );
				}
			},
			[ clientIds, removeBlocks, updateBlockAttributes ]
		);

		const updateStoredPrompt = useCallback(
			( assistantContent: string ) => {
				setStoredPrompt( prevPrompt => {
					const messages: Array< PromptItemProps > = [
						/*
						 * Do not store `system` role items,
						 * and preserve the last 3 ones.
						 */
						...prevPrompt.messages.filter( message => message.role !== 'system' ).slice( -3 ),
						{
							role: 'assistant',
							content: assistantContent, // + 1 `assistant` role item
						},
					];

					return { ...prevPrompt, messages };
				} );
			},
			[ setStoredPrompt ]
		);

		const { requestingState } = useSuggestionsFromAI( {
			prompt: storedPrompt.messages,
			onSuggestion: updateBlockContent,
			onDone: updateStoredPrompt,
			onError: showSuggestionError,
		} );

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
						requestingState={ requestingState }
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
