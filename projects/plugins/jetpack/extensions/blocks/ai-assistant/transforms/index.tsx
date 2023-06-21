/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import TurndownService from 'turndown';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';
/**
 * Types
 */
import { PromptItemProps } from '../lib/prompt';

const turndownService = new TurndownService();

const transformFromCore = {
	type: 'block',
	blocks: EXTENDED_BLOCKS,
	isMatch: () => isPossibleToExtendBlock(),
	transform: ( { content } ) => {
		const messages: Array< PromptItemProps > = [
			{
				role: 'assistant',
				content,
			},
		];

		return createBlock( blockName, { content: turndownService.turndown( content ), messages } );
	},
};

const from = [ transformFromCore ];

export default { from };
