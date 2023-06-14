/**
 * External dependencies
 */
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown, {
	AiAssistantDropdownOnChangeOptionsArgProps,
	AiAssistantSuggestionProp,
} from '../../components/ai-assistant-controls';
import AiAssistantPanel from '../../components/ai-assistant-panel';
import { buildPrompt } from '../../lib/prompt';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		const content = props?.attributes?.content;
		const requestSuggestion = useCallback(
			(
				suggestion: AiAssistantSuggestionProp,
				options: AiAssistantDropdownOnChangeOptionsArgProps
			) => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const prompt = buildPrompt( {
					type: suggestion,
					generatedContent: content,
					options,
				} );
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
