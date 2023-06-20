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
import { PromptItemProps, PromptTypeProp, getPrompt } from '../../lib/prompt';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { clientId } = props;
		const [ storedPrompt, setStoredPrompt ] = useState< Array< PromptItemProps > >( [] );

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

		useSuggestionsFromAI( { prompt: storedPrompt, onSuggestion: setContent } );

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				setStoredPrompt(
					getPrompt( promptType, {
						...options,
						content,
					} )
				);
			},
			[ content ]
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
