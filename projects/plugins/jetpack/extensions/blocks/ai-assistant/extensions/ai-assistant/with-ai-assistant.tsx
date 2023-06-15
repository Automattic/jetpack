/**
 * External dependencies
 */
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
} from '../../components/ai-assistant-controls';
import AiAssistantPanel from '../../components/ai-assistant-panel';
import useSuggestionsFromAI from '../../hooks/use-suggestions-from-ai';
import { PromptItemProps, PromptTypeProp, getPrompt } from '../../lib/prompt';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const { setAttributes } = props;
		const [ prompt, setPrompt ] = useState< Array< PromptItemProps > >( [] );

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
				setAttributes( { content: newContent } );
			},
			[ setAttributes ]
		);

		useSuggestionsFromAI( { prompt, onSuggestion: setContent } );

		const requestSuggestion = useCallback(
			( promptType: PromptTypeProp, options: AiAssistantDropdownOnChangeOptionsArgProps ) => {
				setPrompt(
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

				<InspectorControls>
					<AiAssistantPanel />
				</InspectorControls>

				<BlockControls group="block">
					<AiAssistantDropdown onChange={ requestSuggestion } />
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
