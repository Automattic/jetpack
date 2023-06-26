/**
 * External dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { RichTextValue, create, insert, slice, toHTMLString } from '@wordpress/rich-text';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
	KEY_ASK_AI_ASSISTANT,
} from '../../components/ai-assistant-controls';
import useSuggestionsFromAI, { SuggestionError } from '../../hooks/use-suggestions-from-ai';
import {
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CORRECT_SPELLING,
	getPrompt,
} from '../../lib/prompt';
import {
	GetTextContentFromSelectedBlocksProps,
	getTextContentFromSelectedBlocks,
} from '../../lib/utils/block-content';
import { transfromToAIAssistantBlock } from '../../transforms';
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
	messages: Array< PromptItemProps >;
	flush: () => void;
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
		const { createNotice } = useDispatch( noticesStore );
		const { updateBlockAttributes, removeBlocks, insertBlock, replaceBlock } =
			useDispatch( blockEditorStore );
		const [ storedPrompt, setStoredPrompt ] = useState< StoredPromptProps >( {
			messages: [],
		} );

		const requestList = useRef< { index: number; data: Array< SetContentOptionsProps > } >( {
			index: 0,
			data: [],
		} );

		const { name: blockType } = props;

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
				const block = requestList.current.data[ requestList.current.index ];
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

		const filterMessages = ( messages: Array< PromptItemProps > ) => {
			return messages.filter( message => message.role !== 'system' ).slice( -3 );
		};

		const updateStoredPrompt = useCallback(
			( assistantContent: string ) => {
				setStoredPrompt( prevPrompt => {
					const messages: Array< PromptItemProps > = [
						/*
						 * Do not store `system` role items,
						 * and preserve the last 3 ones.
						 */
						...filterMessages( prevPrompt.messages ),
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

		const handleDone = useCallback(
			( newContent: string ) => {
				// Update Stored Prompt
				updateStoredPrompt( newContent );

				if ( requestList.current.index === requestList.current.data.length - 1 ) {
					// Reset request list
					requestList.current.index = 0;
					requestList.current.data = [];
				} else {
					// Flush next request
					requestList.current.index += 1;
					requestList.current.data[ requestList.current.index ]?.flush();
				}
			},
			[ updateStoredPrompt ]
		);

		const { request, requestingState } = useSuggestionsFromAI( {
			prompt: storedPrompt.messages,
			onSuggestion: setContent,
			onDone: handleDone,
			onError: showSuggestionError,
			autoRequest: false,
		} );

		const removeFirstBlockPartialContent = useCallback(
			( blocks: GetTextContentFromSelectedBlocksProps[] ) => {
				const firstBlock = blocks?.[ 0 ];

				// Remove partial content from first block if needed
				if ( firstBlock?.offset?.start !== 0 ) {
					updateBlockAttributes( firstBlock.clientId, {
						content: toHTMLString( {
							value: slice( firstBlock.content, 0, firstBlock.offset.start ),
						} ),
					} );
				}
			},
			[ updateBlockAttributes ]
		);

		const removeUnusedBlocks = useCallback(
			( blocks: GetTextContentFromSelectedBlocksProps[] ) => {
				// Just remove blocks if has more than one.
				if ( blocks?.length > 1 ) {
					const otherBlocks = [ ...blocks ];
					const lastBlock = otherBlocks.pop();
					otherBlocks.shift();

					removeBlocks( otherBlocks.map( block => block.clientId ) );

					// Remove entire last block or partial if it was partial selected.
					if ( lastBlock.offset.end === lastBlock.content.text.length ) {
						removeBlocks( lastBlock.clientId );
					} else {
						updateBlockAttributes( lastBlock.clientId, {
							content: toHTMLString( {
								value: slice(
									lastBlock.content,
									lastBlock.offset.end,
									lastBlock.content.text.length
								),
							} ),
						} );
					}
				}
			},
			[ removeBlocks, updateBlockAttributes ]
		);

		const insertNewBlockAfterSelectedContent = useCallback(
			( blocks: GetTextContentFromSelectedBlocksProps[], type: string, content: string ) => {
				const newBlock = createBlock( type, { content } );
				const lastBlock = blocks[ blocks.length - 1 ];
				insertBlock( newBlock, lastBlock.index + 1 );
				return newBlock;
			},
			[ insertBlock ]
		);

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				const { blocks, allSelectedContent, allContent } = getTextContentFromSelectedBlocks();

				const handleSetStoredPrompt = () =>
					setStoredPrompt( prevPrompt => {
						const current = requestList.current.data;

						// Flush first request
						current[ 0 ]?.flush();

						// Update the stored prompt locally.
						// Getting only the last since it will contain the previous ones.
						const lastMessage = current[ current?.length - 1 ]?.messages || [];
						return { ...prevPrompt, messages: lastMessage };
					} );

				const generateRequestList = ( list: Array< GetTextContentFromSelectedBlocksProps > ) => {
					return list.reduce( ( acc, block ) => {
						const { selectedContent } = block;
						const prevMessages = acc[ acc.length - 1 ]?.messages || storedPrompt.messages;
						const prevMessagesFiltered = filterMessages( prevMessages );
						const messages = getPrompt( promptType, {
							...options,
							content: toHTMLString( { value: selectedContent } ),
							prevMessages: prevMessagesFiltered,
						} );

						return [
							...acc,
							{
								...block,
								messages,
								flush: () => {
									request( messages );
								},
							},
						];
					}, [] );
				};

				const generateDataForAllContent = () => {
					const newBlock = insertNewBlockAfterSelectedContent( blocks, blockType, '...' );

					return {
						clientId: newBlock.clientId,
						index: 0,
						content: allContent,
						selectedContent: allSelectedContent,
						offset: {
							start: 0,
							end: allSelectedContent.text.length,
						},
					};
				};

				switch ( promptType ) {
					case PROMPT_TYPE_CORRECT_SPELLING:
					case PROMPT_TYPE_CHANGE_LANGUAGE:
					case PROMPT_TYPE_CHANGE_TONE:
						requestList.current.data = generateRequestList( blocks );
						removeFirstBlockPartialContent( blocks );
						handleSetStoredPrompt();
						break;
					default:
						requestList.current.data = generateRequestList( [ generateDataForAllContent() ] );
						removeUnusedBlocks( blocks );
						removeFirstBlockPartialContent( blocks );
						handleSetStoredPrompt();
						break;
				}
			},
			[
				blockType,
				insertNewBlockAfterSelectedContent,
				removeFirstBlockPartialContent,
				removeUnusedBlocks,
				request,
				storedPrompt.messages,
			]
		);

		const replaceWithAiAssistantBlock = useCallback( () => {
			const { blocks, allSelectedContent } = getTextContentFromSelectedBlocks();

			removeUnusedBlocks( blocks );

			// If we have more than one block selected, and the first block is selected after the initial point
			// we need to create a new block.
			if ( blocks?.[ 0 ]?.offset?.start !== 0 ) {
				removeFirstBlockPartialContent( blocks );
				insertNewBlockAfterSelectedContent(
					blocks,
					'jetpack/ai-assistant',
					toHTMLString( { value: allSelectedContent } )
				);
			} else {
				replaceBlock(
					blocks?.[ 0 ]?.clientId,
					transfromToAIAssistantBlock( {
						content: toHTMLString( { value: allSelectedContent } ),
						blockType,
					} )
				);
			}
		}, [
			blockType,
			insertNewBlockAfterSelectedContent,
			removeFirstBlockPartialContent,
			removeUnusedBlocks,
			replaceBlock,
		] );

		const { allContent } = getTextContentFromSelectedBlocks();

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls group="block">
					<AiAssistantDropdown
						requestingState={ requestingState }
						disabled={ ! allContent?.text?.length }
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
