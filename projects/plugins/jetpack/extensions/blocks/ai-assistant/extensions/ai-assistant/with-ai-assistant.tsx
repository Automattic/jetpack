/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI from '../../hooks/use-suggestions-from-ai';
import { getPrompt } from '../../lib/prompt';
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
		const { clientId } = props;
		const [ storedPrompt, setStoredPrompt ] = useState< StoredPromptProps >( {
			messages: [],
		} );

		const { updateBlockAttributes } = useDispatch( blockEditorStore );

		/*
		 * Pick the content from the block attribute from now.
		 * @todo: it doesn't scale well, we need to find a better way to get the content.
		 */
		const content: string = props?.attributes?.content;

		/**
		 * Set the content of the block.
		 *
		 * @param {string} newContent - The new content of the block.
		 * @returns {void}
		 */
		const setContent = useCallback(
			( newContent: string ) => {
				/*
				 * Update the content of the block
				 * by calling the setAttributes function,
				 * updating the `content` attribute.
				 * It doesn't scale for other blocks.
				 * @todo: find a better way to update the content.
				 */
				updateBlockAttributes( clientId, { content: newContent } );
			},
			[ clientId, updateBlockAttributes ]
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

					// Update the stored prompt.
					return freshPrompt;
				} );
			},
			[ content, request ]
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
