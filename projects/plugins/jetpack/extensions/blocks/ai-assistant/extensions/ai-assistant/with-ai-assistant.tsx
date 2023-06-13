/**
 * External dependencies
 */
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import React from 'react';
/**
 * Internal dependencies
 */
import AiAssistantDropdown from '../../components/ai-assistant-controls';
import AiAssistantPanel from '../../components/ai-assistant-panel';

/*
 * Extend the withAIAssistant function of the block
 * to implement multiple blocks edition
 */
export const withAIAssistant = createHigherOrderComponent(
	BlockEdit => props => {
		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls>
					<AiAssistantPanel />
				</InspectorControls>

				<BlockControls group="block">
					<AiAssistantDropdown
						onChange={ item => {
							console.log( { item } ); // eslint-disable-line no-console
						} }
					/>
				</BlockControls>
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
