/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { RichTextValue, create, insert, join, slice, toHTMLString } from '@wordpress/rich-text';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI from '../../hooks/use-suggestions-from-ai';
import {
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	getPrompt,
} from '../../lib/prompt';
import { getTextContentFromBlocks } from '../../lib/utils/block-content';
/*
 * Types
 */
import type { PromptItemProps, PromptTypeProp } from '../../lib/prompt';

type StoredPromptProps = {
	messages: Array< PromptItemProps >;
};

type SetContentOptionsProps = {
	clientId: string;
	content: RichTextValue;
	offset: {
		start: number;
		end: number;
	};
};

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { updateBlockAttributes, removeBlocks } = useDispatch( blockEditorStore );
		const [ storedPrompt, setStoredPrompt ] = useState< StoredPromptProps >( {
			messages: [],
		} );

		/**
		 * Set the content of the block.
		 *
		 * @param {string} newContent - The new content of the block.
		 * @returns {void}
		 */
		const setContent = useCallback(
			(
				newContent: string,
				{ blocks, index }: { blocks: Array< SetContentOptionsProps >; index?: number }
			) => {
				const block = blocks[ index || 0 ];
				const clientId = block?.clientId;
				const content = block?.content;
				const offset = block?.offset;
				const newRichTextContent = create( { html: newContent } );
				const replacedRichTextContent = insert(
					content,
					newRichTextContent,
					offset.start,
					offset.end
				);

				/*
				 * Update the content of the block
				 * by calling the setAttributes function,
				 * updating the `content` attribute.
				 */
				updateBlockAttributes( clientId, {
					content: toHTMLString( { value: replacedRichTextContent } ),
				} );
			},
			[ updateBlockAttributes ]
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
				const blocks = getTextContentFromBlocks();
				const firstBlock = blocks[ 0 ];
				const otherBlocks = blocks.slice( 1 );
				const mixedContent = join( blocks.map( block => block.content ) );

				const handleSetStoredPrompt = ( blocksList: Array< SetContentOptionsProps > ) =>
					setStoredPrompt( prevPrompt => {
						const allMessages = blocksList.reduce( ( acc, { content, offset } ) => {
							acc.push(
								getPrompt( promptType, {
									...options,
									content: toHTMLString( { value: slice( content, offset.start, offset.end ) } ),
									prevMessages: prevPrompt.messages,
								} )
							);

							return acc;
						}, [] );

						// Request the suggestion from the AI.
						request( allMessages, { blocks: blocksList } );

						// Update the stored prompt locally.
						return prevPrompt;
					} );

				const generateDataForMixedContent = () => ( {
					clientId: firstBlock.clientId,
					content: mixedContent,
					offset: {
						start: 0,
						end: toHTMLString( { value: mixedContent } ).length,
					},
				} );

				switch ( promptType ) {
					case PROMPT_TYPE_CORRECT_SPELLING:
					case PROMPT_TYPE_CHANGE_LANGUAGE:
					case PROMPT_TYPE_CHANGE_TONE:
						handleSetStoredPrompt( blocks );
						break;
					default:
						handleSetStoredPrompt( [ generateDataForMixedContent() ] );
						removeBlocks( otherBlocks.map( block => block.clientId ) );
						break;
				}
			},
			[ removeBlocks, request ]
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
