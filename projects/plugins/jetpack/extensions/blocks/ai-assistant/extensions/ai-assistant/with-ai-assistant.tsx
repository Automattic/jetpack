/**
 * External dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import React from 'react';
/**
 * Internal dependencies
 */
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
			</>
		);
	},
	'withAIAssistant'
);

export default withAIAssistant;
