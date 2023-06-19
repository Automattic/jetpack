/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';
import { PromptItemProps } from '../lib/prompt';

const transformFromCore = {
	type: 'block',
	blocks: EXTENDED_BLOCKS,
	isMatch: () => isPossibleToExtendBlock(),
	transform: ( { content } ) => {
		const messages: Array< PromptItemProps > = [
			{
				role: 'user',
				content,
			},
		];

		return createBlock( blockName, { content, messages } );
	},
};

const from = [ transformFromCoreEmbed ];

export default { from };
