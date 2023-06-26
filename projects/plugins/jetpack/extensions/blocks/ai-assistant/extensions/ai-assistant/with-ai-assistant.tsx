/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
	KEY_ASK_AI_ASSISTANT,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI, { SuggestionError } from '../../hooks/use-suggestions-from-ai';
import { getPrompt } from '../../lib/prompt';
import {
	getRawTextFromHTML,
	getTextContentFromSelectedBlocks,
} from '../../lib/utils/block-content';
/*
 * Types
 */
import { transfromToAIAssistantBlock } from '../../transforms';
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

		const { name: blockType } = props;

		const { updateBlockAttributes, removeBlocks, replaceBlock } = useDispatch( blockEditorStore );
		const { createNotice } = useDispatch( noticesStore );

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

		const { request, requestingState } = useSuggestionsFromAI( {
			prompt: storedPrompt.messages,
			onSuggestion: setContent,
			onDone: updateStoredPrompt,
			onError: showSuggestionError,
			autoRequest: false,
		} );

		const { content, clientIds } = getTextContentFromSelectedBlocks();

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				/*
				 * Store the selected clientIds when the user requests a suggestion.
				 * The client Ids will be used to update the content of the block,
				 * when suggestions are received from the AI.
				 */
				clientIdsRef.current = clientIds;

				setStoredPrompt( prevPrompt => {
					const messages = getPrompt( promptType, {
						...options,
						content,
						prevMessages: prevPrompt.messages,
					} );

					const freshPrompt = { ...prevPrompt, messages };
					// Request the suggestion from the AI.
					request( freshPrompt.messages );

					// Update the stored prompt locally.
					return freshPrompt;
				} );
			},
			[ clientIds, content, request ]
		);

		const replaceWithAiAssistantBlock = useCallback( () => {
			replaceBlock( props.clientId, transfromToAIAssistantBlock( { content, blockType } ) );
		}, [ blockType, content, props.clientId, replaceBlock ] );

		const rawContent = getRawTextFromHTML( props.attributes.content );

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls group="block">
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
