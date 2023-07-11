/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useRef } from '@wordpress/element';
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
import { transfromToAIAssistantBlock } from '../../transforms';
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

		const clientIdsRef = useRef< Array< string > >();

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

		const { requestingState } = useSuggestionsFromAI( {
			prompt: storedPrompt.messages,
			onSuggestion: setContent,
			onDone: updateStoredPrompt,
			onError: showSuggestionError,
		} );

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				const newAIAssistantBlock = transfromToAIAssistantBlock( { content }, blockType );

				/*
				 * Store in the local storage the client id
				 * of the block that need to auto-trigger the AI Assistant request.
				 * @todo: find a better way to update the content,
				 * probably using a new store triggering an action.
				 */

				// Storage client Id, prompt type, and options.
				const storeObject = {
					clientId: props.clientId,
					type: promptType,
					options,
				};

				localStorage.setItem(
					getStoreBlockId( newAIAssistantBlock.clientId ),
					JSON.stringify( storeObject )
				);

				replaceBlock( props.clientId, newAIAssistantBlock );
			},
			[ blockType, content, props.clientId, replaceBlock ]
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
				transfromToAIAssistantBlock( extendedBlockAttributes, blockType )
			);

			removeBlocks( otherBlocksIds );
		}, [ blocks, blockType, content, replaceBlock, clientIds, removeBlocks ] );

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
