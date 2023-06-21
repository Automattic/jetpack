/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useRef } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI from '../../hooks/use-suggestions-from-ai';
import { getPrompt } from '../../lib/prompt';
import { getTextContentFromBlocks } from '../../lib/utils/block-content';
/*
 * Types
 */
import type { PromptItemProps, PromptTypeProp } from '../../lib/prompt';

type StoredPromptProps = {
	messages: Array< PromptItemProps >;
};

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const [ storedPrompt, setStoredPrompt ] = useState< StoredPromptProps >( {
			messages: [],
		} );

		const clientIdsRef = useRef< Array< string > >();

		const { updateBlockAttributes, removeBlocks } = useDispatch( blockEditorStore );

		/**
		 * Set the content of the block.
		 *
		 * @param {string} newContent - The new content of the block.
		 * @returns {void}
		 */
		const setContent = useCallback(
			( newContent: string ) => {
				/*
				 * Pick the first item of the array,
				 * to be udpated with the new content.
				 * The rest of the items will be removed.
				 */
				const [ firstClientId, ...restClientIds ] = clientIdsRef.current;
				/*
				 * Update the content of the block
				 * by calling the setAttributes function,
				 * updating the `content` attribute.
				 * It doesn't scale for other blocks.
				 * @todo: find a better way to update the content.
				 */
				updateBlockAttributes( firstClientId, { content: newContent } );

				// Remove the rest of the block in case there are more than one.
				if ( restClientIds.length ) {
					removeBlocks( restClientIds ).then( () => {
						clientIdsRef.current = [ firstClientId ];
					} );
				}
			},
			[ removeBlocks, updateBlockAttributes ]
		);

		const addAssistantMessage = useCallback(
			( assistantContent: string ) => {
				setStoredPrompt( prevPrompt => {
					/*
					 * Add the assistant messages to the prompt.
					 * - Preserve the first item of the array (`system` role )
					 * - Keep the last 4 messages.
					 */

					// Pick the first item of the array.
					const firstItem = prevPrompt.messages.shift();

					const messages: Array< PromptItemProps > = [
						firstItem, // first item (`system` by default)
						...prevPrompt.messages.splice( -3 ), // last 3 items
						{
							role: 'assistant',
							content: assistantContent, // + 1 `assistant` role item
						},
					];

					return {
						...prevPrompt,
						messages,
					};
				} );
			},
			[ setStoredPrompt ]
		);

		const { request } = useSuggestionsFromAI( {
			prompt: storedPrompt.messages,
			onSuggestion: setContent,
			onDone: addAssistantMessage,
			autoRequest: false,
		} );

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				const { content, clientIds } = getTextContentFromBlocks();

				/*
				 * Store the selected clientIds when the user requests a suggestion.
				 * The client Ids will be used to update the content of the block,
				 * when suggestions are received from the AI.
				 */
				clientIdsRef.current = clientIds;

				setStoredPrompt( prevPrompt => {
					const freshPrompt = {
						...prevPrompt,
						messages: getPrompt( promptType, {
							...options,
							content,
							prevMessages: prevPrompt.messages,
						} ),
					};

					// Request the suggestion from the AI.
					request( freshPrompt.messages );

					// Update the stored prompt locally.
					return freshPrompt;
				} );
			},
			[ request ]
		);

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls group="block">
					<AiAssistantDropdown onChange={ requestSuggestion } />
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
